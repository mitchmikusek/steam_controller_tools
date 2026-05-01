export enum SCProtocolId {
  SetControllerMappings = 0x80,
  ClearControllerMappings = 0x81,
  GetControllerMappings = 0x82,
  ControllerInfoRequest = 0x83,
  ResetControllerMappings = 0x85,
  FactoryReset = 0x86,
  SetSettings = 0x87,
  SetSettingsDefaultValues = 0x8e,
  TriggerHapticPulse = 0x8f,
  RebootToISP = 0x90,
  EraseLPCFirmware = 0x91,
  FlashLPCFirmware = 0x92,
  VerifyLPCFirmware = 0x93,
  ResetSOC = 0x95,
  EraseNRFFirmware = 0x97,
  FlashNRFFirmware = 0x98,
  VerifyNRFFirmware = 0x99,
  TurnOffController = 0x9f,
  SetHardwareVersion = 0xa0,
  CalibrateTrackpads = 0xa7,
  ControllerInfoRequest2 = 0xae,
  CalibrateIMU = 0xb5,
  PlayAudio = 0xb6,
  StartFlashJingle = 0xb7,
  FlashJingle = 0xb8,
  EndFlashJingle = 0xb9,
  GetChipID = 0xba,
  ReadUID = 0xbb,
  CalibrateJoystick = 0xbf,
  SetPersonalise = 0xc1,
  SendIRCode = 0xc6,
  FlashSWD = 0xc7,
  SWDErase = 0xca,
  SWDSave = 0xcb,
}

export const VALVE_VID = 0x28de;
export const CONTROLLER_PID = 0x1102;
export const BOOTLOADER_PID = 0x1002;
export const CONTROLLER_INTERFACE = 2;
export const BOOTLOADER_INTERFACE = 0;
export const REPORT_ID = 0x00;
export const REPORT_SIZE = 64;

// Magic bytes to enter bootloader from normal mode
export const BOOTLOADER_MAGIC = [0x04, 0xc0, 0xba, 0xaa, 0xec];

// Jingle names by index
export const JINGLES = [
  'Warm and Happy',
  'Invader',
  'Controller Confirmed',
  'Victory!',
  'Rise and Shine',
  'Shorty',
  'Warm Boot',
  'Next Level',
  'Shake It Off',
  'Access Denied',
  'Deactivate',
  'Discovery',
  'Triumph',
  'The Mann',
] as const;
