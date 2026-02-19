use serde::{Deserialize, Serialize};
use serialport::{SerialPort, SerialPortType};
use std::collections::HashMap;
use std::fs;
use std::io::{self, Read};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, LazyLock, Mutex};
use std::thread::JoinHandle;
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};

#[derive(Serialize)]
struct SerialPortInfo {
	port_name: String,
	port_type: String,
}

#[derive(Clone, Serialize)]
struct DecodedSample {
	timestamp_ms: u128,
	values: HashMap<String, f64>,
}

#[derive(Serialize)]
struct DatalogPollUpdate {
	is_logging: bool,
	last_error: Option<String>,
	lines: Vec<String>,
	total_bytes: u64,
	decoded_samples: Vec<DecodedSample>,
	protocol_mode: String,
}

#[derive(Default)]
struct DatalogSharedState {
	last_error: Option<String>,
	pending_lines: Vec<String>,
	pending_samples: Vec<DecodedSample>,
	total_bytes: u64,
	protocol_mode: String,
}

#[derive(Clone, Deserialize)]
struct BmwChannelConfig {
	command: String,
	decode: DecodeConfig,
}

#[derive(Clone, Deserialize)]
struct DecodeConfig {
	#[serde(rename = "type")]
	type_field: String,
	byte_index: usize,
	scale: f64,
	offset: f64,
}

struct DatalogSession {
	shared: Arc<Mutex<DatalogSharedState>>,
	stop_signal: Arc<AtomicBool>,
	thread: Option<JoinHandle<()>>,
}

#[derive(Default)]
struct RuntimeState {
	session: Option<DatalogSession>,
}

static RUNTIME_STATE: LazyLock<Mutex<RuntimeState>> =
	LazyLock::new(|| Mutex::new(RuntimeState::default()));
const MAX_PENDING_LINES: usize = 1_500;
const MAX_PENDING_SAMPLES: usize = 500;

fn now_timestamp_ms() -> u128 {
	match SystemTime::now().duration_since(UNIX_EPOCH) {
		Ok(duration) => duration.as_millis(),
		Err(_) => 0,
	}
}

fn push_line(shared: &mut DatalogSharedState, line: String) {
	shared.pending_lines.push(line);
	if shared.pending_lines.len() > MAX_PENDING_LINES {
		let overflow = shared.pending_lines.len() - MAX_PENDING_LINES;
		shared.pending_lines.drain(0..overflow);
	}
}

fn push_sample(shared: &mut DatalogSharedState, sample: DecodedSample) {
	shared.pending_samples.push(sample);
	if shared.pending_samples.len() > MAX_PENDING_SAMPLES {
		let overflow = shared.pending_samples.len() - MAX_PENDING_SAMPLES;
		shared.pending_samples.drain(0..overflow);
	}
}

fn bytes_to_hex(bytes: &[u8]) -> String {
	bytes
		.iter()
		.map(|byte| format!("{byte:02X}"))
		.collect::<Vec<String>>()
		.join(" ")
}

fn stop_active_session() {
	let session = {
		let mut runtime = RUNTIME_STATE.lock().expect("runtime state poisoned");
		runtime.session.take()
	};

	if let Some(mut active_session) = session {
		active_session.stop_signal.store(true, Ordering::Relaxed);
		if let Some(thread) = active_session.thread.take() {
			let _ = thread.join();
		}
	}
}

fn parse_hex_tokens(raw: &str) -> Vec<u8> {
	raw.split(|character: char| character.is_whitespace() || character == '>' || character == '\r' || character == '\n')
		.filter_map(|token| {
			let trimmed = token.trim();
			if trimmed.len() != 2 {
				return None;
			}
			u8::from_str_radix(trimmed, 16).ok()
		})
		.collect::<Vec<u8>>()
}

fn read_elm_response(port: &mut dyn SerialPort) -> Result<String, String> {
	let mut collected = String::new();
	let started_at = Instant::now();
	let timeout = Duration::from_millis(900);

	while started_at.elapsed() < timeout {
		let mut chunk = [0_u8; 256];
		match port.read(&mut chunk) {
			Ok(bytes_read) => {
				if bytes_read == 0 {
					continue;
				}
				let text = String::from_utf8_lossy(&chunk[..bytes_read]);
				collected.push_str(&text);
				if collected.contains('>') {
					return Ok(collected);
				}
			}
			Err(error) if error.kind() == io::ErrorKind::TimedOut => {}
			Err(error) => return Err(format!("Serial read failed: {error}")),
		}
	}

	if collected.is_empty() {
		Err(String::from("No response from adapter."))
	} else {
		Ok(collected)
	}
}

fn send_elm_command(port: &mut dyn SerialPort, command: &str) -> Result<String, String> {
	let payload = format!("{command}\r");
	port
		.write_all(payload.as_bytes())
		.map_err(|error| format!("Failed to write command {command}: {error}"))?;
	port
		.flush()
		.map_err(|error| format!("Failed to flush command {command}: {error}"))?;
	read_elm_response(port)
}

fn initialize_elm_adapter(port: &mut dyn SerialPort) -> Result<(), String> {
	let init_commands = ["ATZ", "ATE0", "ATL0", "ATH0", "ATS0", "ATSP0"];

	for command in init_commands {
		let response = send_elm_command(port, command)?;
		if command == "ATZ" {
			continue;
		}
		let normalized = response.to_uppercase();
		if !(normalized.contains("OK") || normalized.contains('>')) {
			return Err(format!("Adapter rejected {command}: {response}"));
		}
	}

	Ok(())
}

fn pid_for_key(key: &str) -> Option<&'static str> {
	match key {
		"engine-rpm" => Some("010C"),
		"throttle-position" => Some("0111"),
		"coolant-temp" => Some("0105"),
		"iat" => Some("010F"),
		"vehicle-speed" => Some("010D"),
		"timing-avg" => Some("010E"),
		"boost-actual" | "boost-target" => Some("010B"),
		"afr-bank1" | "afr-bank2" => Some("0144"),
		"oil-temp" => Some("015C"),
		"fuel-pressure" => Some("010A"),
		_ => None,
	}
}

fn find_pid_payload(bytes: &[u8], pid: u8) -> Option<&[u8]> {
	bytes.windows(2).find_map(|window| {
		if window[0] == 0x41 && window[1] == pid {
			let start_index = bytes
				.windows(2)
				.position(|candidate| candidate == window)
				.unwrap_or(0);
			Some(&bytes[start_index + 2..])
		} else {
			None
		}
	})
}

fn decode_pid_value(parameter_key: &str, payload: &[u8]) -> Option<f64> {
	match parameter_key {
		"engine-rpm" => payload
			.get(0)
			.zip(payload.get(1))
			.map(|(a, b)| (((*a as u16) * 256 + *b as u16) as f64) / 4.0),
		"throttle-position" => payload.get(0).map(|value| (*value as f64 * 100.0) / 255.0),
		"coolant-temp" | "iat" | "oil-temp" => payload.get(0).map(|value| *value as f64 - 40.0),
		"vehicle-speed" => payload.get(0).map(|value| *value as f64),
		"timing-avg" => payload.get(0).map(|value| *value as f64 / 2.0 - 64.0),
		"boost-actual" | "boost-target" => payload
			.get(0)
			.map(|value| ((*value as f64) - 100.0) * 0.145_038),
		"afr-bank1" | "afr-bank2" => payload
			.get(0)
			.zip(payload.get(1))
			.map(|(a, b)| (((*a as u16) * 256 + *b as u16) as f64) / 32_768.0),
		"fuel-pressure" => payload.get(0).map(|value| *value as f64 * 3.0),
		_ => None,
	}
}

fn request_pid_value(
	port: &mut dyn SerialPort,
	parameter_key: &str,
	pid_command: &str,
) -> Result<Option<f64>, String> {
	let response = send_elm_command(port, pid_command)?;
	let pid_code = u8::from_str_radix(&pid_command[2..], 16)
		.map_err(|error| format!("Invalid PID command {pid_command}: {error}"))?;
	let bytes = parse_hex_tokens(&response);
	if bytes.is_empty() {
		return Ok(None);
	}
	if let Some(payload) = find_pid_payload(&bytes, pid_code) {
		return Ok(decode_pid_value(parameter_key, payload));
	}
	Ok(None)
}

fn build_simulated_sample(parameter_keys: &[String], sample_index: u64) -> HashMap<String, f64> {
	let rpm = (750 + ((sample_index % 220) as i32 - 110) * 8).max(650) as f64;
	let throttle = ((sample_index % 100) as f64).min(92.0);
	let coolant = 88.0 + ((sample_index % 12) as f64 - 6.0) * 0.15;
	let iat = 38.0 + ((sample_index % 20) as f64 - 10.0) * 0.2;
	let speed = (sample_index % 145) as f64;
	let timing = 8.0 + ((sample_index % 16) as f64 - 8.0) * 0.25;
	let map_kpa = 112.0 + ((sample_index % 60) as f64 - 30.0) * 0.7;
	let boost = (map_kpa - 100.0) * 0.145_038;
	let lambda = 0.84 + ((sample_index % 30) as f64 - 15.0) * 0.0015;
	let oil_temp = 95.0 + ((sample_index % 16) as f64 - 8.0) * 0.2;
	let fuel_pressure = 620.0 + ((sample_index % 20) as f64 - 10.0) * 2.5;

	let mut values = HashMap::new();
	for key in parameter_keys {
		let value = match key.as_str() {
			"engine-rpm" => Some(rpm),
			"throttle-position" => Some(throttle),
			"coolant-temp" => Some(coolant),
			"iat" => Some(iat),
			"vehicle-speed" => Some(speed),
			"timing-avg" => Some(timing),
			"boost-actual" | "boost-target" => Some(boost),
			"afr-bank1" | "afr-bank2" => Some(lambda),
			"oil-temp" => Some(oil_temp),
			"fuel-pressure" => Some(fuel_pressure),
			_ => None,
		};
		if let Some(sample_value) = value {
			values.insert(key.clone(), sample_value);
		}
	}

	if values.is_empty() {
		values.insert(String::from("engine-rpm"), rpm);
	}

	values
}

fn load_bmw_channel_catalog() -> HashMap<String, BmwChannelConfig> {
	match fs::read_to_string("config/bmw_channels.json") {
		Ok(content) => serde_json::from_str::<HashMap<String, BmwChannelConfig>>(&content)
			.unwrap_or_default(),
		Err(_) => HashMap::new(),
	}
}

fn decode_from_config(bytes: &[u8], decode: &DecodeConfig) -> Option<f64> {
	let index = decode.byte_index;
	let raw = match decode.type_field.as_str() {
		"u8" => bytes.get(index).map(|value| *value as f64)?,
		"u16be" => bytes
			.get(index)
			.zip(bytes.get(index + 1))
			.map(|(msb, lsb)| ((*msb as u16) * 256 + *lsb as u16) as f64)?,
		"i16be" => bytes
			.get(index)
			.zip(bytes.get(index + 1))
			.map(|(msb, lsb)| i16::from_be_bytes([*msb, *lsb]) as f64)?,
		_ => return None,
	};
	Some(raw * decode.scale + decode.offset)
}

fn request_bmw_channel_value(
	port: &mut dyn SerialPort,
	config: &BmwChannelConfig,
) -> Result<Option<f64>, String> {
	let response = send_elm_command(port, &config.command)?;
	let bytes = parse_hex_tokens(&response);
	if bytes.is_empty() {
		return Ok(None);
	}

	let payload = bytes.as_slice();
	Ok(decode_from_config(payload, &config.decode))
}

#[derive(Serialize)]
struct DtcRecord {
	code: String,
	description: String,
	severity: String,
	status: String,
	timestamp: String,
}

#[tauri::command]
fn list_serial_ports() -> Result<Vec<SerialPortInfo>, String> {
	let ports = serialport::available_ports()
		.map_err(|error| format!("Unable to enumerate serial ports: {error}"))?;

	let result = ports
		.into_iter()
		.map(|port| {
			let port_type = match port.port_type {
				SerialPortType::UsbPort(_) => "usb",
				SerialPortType::BluetoothPort => "bluetooth",
				SerialPortType::PciPort => "pci",
				SerialPortType::Unknown => "unknown",
			};

			SerialPortInfo {
				port_name: port.port_name,
				port_type: String::from(port_type),
			}
		})
		.collect::<Vec<SerialPortInfo>>();

	Ok(result)
}

#[tauri::command]
fn read_dtcs() -> Vec<DtcRecord> {
	vec![
		DtcRecord {
			code: String::from("2C57"),
			description: String::from("Charge-air pressure control: plausibility"),
			severity: String::from("medium"),
			status: String::from("active"),
			timestamp: String::from("2026-02-17T15:10:00Z"),
		},
		DtcRecord {
			code: String::from("2AAF"),
			description: String::from("Fuel pump plausibility"),
			severity: String::from("high"),
			status: String::from("stored"),
			timestamp: String::from("2026-02-14T22:41:00Z"),
		},
		DtcRecord {
			code: String::from("2E8B"),
			description: String::from("Intelligent battery sensor communication"),
			severity: String::from("low"),
			status: String::from("pending"),
			timestamp: String::from("2026-02-10T09:27:00Z"),
		},
	]
}

#[tauri::command]
fn clear_dtcs() -> bool {
	true
}

#[tauri::command]
fn verify_serial_port(port_name: String, baud_rate: u32) -> Result<bool, String> {
	let _port = serialport::new(port_name, baud_rate)
		.timeout(Duration::from_millis(250))
		.open()
		.map_err(|error| format!("Unable to open serial port: {error}"))?;
	Ok(true)
}

#[tauri::command]
fn start_datalogging(
	connection_mode: String,
	port_name: Option<String>,
	baud_rate: u32,
	selected_parameter_keys: Option<Vec<String>>,
) -> Result<bool, String> {
	stop_active_session();

	let shared = Arc::new(Mutex::new(DatalogSharedState::default()));
	let stop_signal = Arc::new(AtomicBool::new(false));
	let mode = connection_mode.to_lowercase();
	let selected_keys = selected_parameter_keys.unwrap_or_else(|| vec![String::from("engine-rpm")]);

	let thread = if mode == "simulator" {
		let shared_clone = Arc::clone(&shared);
		let stop_clone = Arc::clone(&stop_signal);
		std::thread::spawn(move || {
			if let Ok(mut state) = shared_clone.lock() {
				state.protocol_mode = String::from("simulator");
			}
			let mut sample_index: u64 = 0;
			while !stop_clone.load(Ordering::Relaxed) {
				sample_index = sample_index.saturating_add(1);
				let values = build_simulated_sample(&selected_keys, sample_index);
				let timestamp_ms = now_timestamp_ms();
				let line = format!("[{timestamp_ms}] SIM {:?}", values);
				if let Ok(mut state) = shared_clone.lock() {
					state.total_bytes = state.total_bytes.saturating_add(line.len() as u64);
					push_line(&mut state, line);
					push_sample(
						&mut state,
						DecodedSample {
							timestamp_ms,
							values,
						},
					);
				}
				std::thread::sleep(Duration::from_millis(110));
			}
		})
	} else {
		let target_port = port_name
			.filter(|name| !name.is_empty())
			.ok_or_else(|| String::from("Port name is required for hardware mode."))?;

		let mut port = serialport::new(target_port, baud_rate)
			.timeout(Duration::from_millis(180))
			.open()
			.map_err(|error| format!("Unable to open serial port: {error}"))?;

		let shared_clone = Arc::clone(&shared);
		let stop_clone = Arc::clone(&stop_signal);
		std::thread::spawn(move || {
			if let Ok(mut state) = shared_clone.lock() {
				state.protocol_mode = String::from("elm_initializing");
			}
			let bmw_catalog = load_bmw_channel_catalog();
			let mut pid_pairs = selected_keys
				.iter()
				.cloned()
				.filter_map(|key| pid_for_key(&key).map(|pid| (key, String::from(pid))))
				.collect::<Vec<(String, String)>>();
			let bmw_pairs = selected_keys
				.iter()
				.filter_map(|key| {
					bmw_catalog
						.get(key)
						.map(|config| (key.clone(), config.clone()))
				})
				.collect::<Vec<(String, BmwChannelConfig)>>();
			if pid_pairs.is_empty() {
				pid_pairs.push((String::from("engine-rpm"), String::from("010C")));
			}

			if initialize_elm_adapter(&mut *port).is_err() {
				if let Ok(mut state) = shared_clone.lock() {
					state.last_error = Some(String::from(
						"Adapter init failed. Falling back to raw serial capture.",
					));
					state.protocol_mode = String::from("raw_fallback");
				}

				let mut buffer = [0_u8; 512];
				while !stop_clone.load(Ordering::Relaxed) {
					match port.read(&mut buffer) {
						Ok(bytes_read) => {
							if bytes_read == 0 {
								continue;
							}
							let payload = &buffer[..bytes_read];
							let line = format!("[{}] {}", now_timestamp_ms(), bytes_to_hex(payload));
							if let Ok(mut state) = shared_clone.lock() {
								state.total_bytes = state.total_bytes.saturating_add(bytes_read as u64);
								push_line(&mut state, line);
							}
						}
						Err(error) if error.kind() == io::ErrorKind::TimedOut => {}
						Err(error) => {
							if let Ok(mut state) = shared_clone.lock() {
								state.last_error = Some(format!("Read failed: {error}"));
							}
							break;
						}
					}
				}
				return;
			}
			if let Ok(mut state) = shared_clone.lock() {
				state.protocol_mode = String::from("elm_obd");
			}

			while !stop_clone.load(Ordering::Relaxed) {
				let timestamp_ms = now_timestamp_ms();
				let mut values = HashMap::new();
				let mut lines_to_push: Vec<String> = Vec::new();
				let mut has_bmw_decoded_value = false;

				for (key, pid) in &pid_pairs {
					if stop_clone.load(Ordering::Relaxed) {
						break;
					}
					match request_pid_value(&mut *port, key, pid) {
						Ok(Some(value)) => {
							values.insert(key.clone(), value);
							lines_to_push.push(format!("[{timestamp_ms}] {key}={value:.3}"));
						}
						Ok(None) => {}
						Err(error) => {
							if let Ok(mut state) = shared_clone.lock() {
								state.last_error = Some(error);
							}
							break;
						}
					}
				}
				for (key, config) in &bmw_pairs {
					if stop_clone.load(Ordering::Relaxed) {
						break;
					}
					match request_bmw_channel_value(&mut *port, config) {
						Ok(Some(value)) => {
							has_bmw_decoded_value = true;
							values.insert(key.clone(), value);
							lines_to_push.push(format!("[{timestamp_ms}] {key}={value:.3}"));
						}
						Ok(None) => {}
						Err(error) => {
							if let Ok(mut state) = shared_clone.lock() {
								state.last_error = Some(error);
							}
							break;
						}
					}
				}

				if let Ok(mut state) = shared_clone.lock() {
					if has_bmw_decoded_value {
						state.protocol_mode = String::from("elm+bmw");
					}
					for line in lines_to_push {
						state.total_bytes = state.total_bytes.saturating_add(line.len() as u64);
						push_line(&mut state, line);
					}
					if !values.is_empty() {
						push_sample(
							&mut state,
							DecodedSample {
								timestamp_ms,
								values,
							},
						);
					}
				}

				std::thread::sleep(Duration::from_millis(85));
			}
		})
	};

	let mut runtime = RUNTIME_STATE.lock().expect("runtime state poisoned");
	runtime.session = Some(DatalogSession {
		shared,
		stop_signal,
		thread: Some(thread),
	});
	Ok(true)
}

#[tauri::command]
fn stop_datalogging() -> bool {
	stop_active_session();
	true
}

#[tauri::command]
fn poll_datalog_updates(max_lines: Option<usize>) -> DatalogPollUpdate {
	let limit = max_lines.unwrap_or(400).max(1);
	let shared = {
		let runtime = RUNTIME_STATE.lock().expect("runtime state poisoned");
		runtime.session.as_ref().map(|session| Arc::clone(&session.shared))
	};

	let Some(shared) = shared else {
		return DatalogPollUpdate {
			is_logging: false,
			last_error: None,
			lines: Vec::new(),
			total_bytes: 0,
			decoded_samples: Vec::new(),
			protocol_mode: String::from("stopped"),
		};
	};

	let mut state = shared.lock().expect("datalog shared state poisoned");
	let mut lines = std::mem::take(&mut state.pending_lines);
	if lines.len() > limit {
		let keep_from = lines.len() - limit;
		lines = lines.split_off(keep_from);
	}
	let decoded_samples = std::mem::take(&mut state.pending_samples);

	DatalogPollUpdate {
		is_logging: true,
		last_error: state.last_error.clone(),
		lines,
		total_bytes: state.total_bytes,
		decoded_samples,
		protocol_mode: state.protocol_mode.clone(),
	}
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
	tauri::Builder::default()
		.invoke_handler(tauri::generate_handler![
			list_serial_ports,
			read_dtcs,
			clear_dtcs,
			verify_serial_port,
			start_datalogging,
			stop_datalogging,
			poll_datalog_updates
		])
		.run(tauri::generate_context!())
		.expect("error while running tauri application");
}
