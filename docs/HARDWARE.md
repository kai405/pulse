# Hardware plan

## Recommended build: camera off-wrist, haptics on-wrist

Do not put a full Raspberry Pi and camera on the wrist for the hackathon MVP. It adds battery, weight, heat, connectivity, and enclosure failure modes without improving the central demo.

Use a laptop webcam or Pi camera as the visual sensor. The wearable should only receive commands and vibrate.

## Core bill of materials

| Part | Qty | Purpose | Notes |
| --- | ---: | --- | --- |
| ESP32 development board | 1 | Wearable controller / BLE or serial endpoint | Preferred for wireless wristband |
| Coin vibration motor or small ERM motor | 1 | Haptic output | Choose a motor with known voltage/current |
| DRV2605L haptic driver breakout | 1 | Drives motor and supports repeatable patterns | Preferred; protects the controller from motor current |
| LiPo battery, 3.7V | 1 | Wristband power | 500–1000 mAh is plenty for a demo |
| LiPo charger/protection board | 1 | Safe battery charging | Use a board matched to battery connector |
| Power switch | 1 | On/off | Prevents draining battery in transit |
| Wrist strap / Velcro / elastic | 1 | Wearable enclosure | Reliability beats beauty |
| Breadboard, jumper wires, electrical tape/heat-shrink | 1 set | Prototyping and strain relief | Bring spares |
| Laptop webcam or USB webcam | 1 | Camera sensor | The simplest camera source |

## Raspberry Pi role

If a Raspberry Pi is already available, it can be useful as a **camera/edge-compute node** or as an alternative motor controller. It is not the recommended wrist-worn controller.

### Pi-only fallback hardware

| Part | Qty | Why it is needed |
| --- | ---: | --- |
| Raspberry Pi (Zero 2 W or any available model) | 1 | Runs camera/receiver code |
| Pi camera or USB webcam | 1 | Visual input |
| NPN transistor or logic-level MOSFET | 1 | GPIO cannot drive a vibration motor directly |
| Flyback diode (for ERM motor) | 1 | Motor transient protection |
| Resistors: 1k and 10k | 1 each | Transistor gate/base wiring |
| Separate motor power source | 1 | Avoid brownouts from Pi power rail |

Never connect a vibration motor directly to a Raspberry Pi GPIO pin.

## ESP32 wiring (recommended)

Use the DRV2605L breakout because it keeps the wiring simple and lets the device play named effects.

```text
ESP32 3V3  → DRV2605L VCC
ESP32 GND  → DRV2605L GND
ESP32 GPIO 21 (SDA) → DRV2605L SDA
ESP32 GPIO 22 (SCL) → DRV2605L SCL
DRV2605L motor outputs → vibration motor leads
LiPo battery → board power input via charger/protection and switch
```

Confirm the voltage requirements on the exact board before wiring. If the selected ESP32 board expects USB 5V/VIN rather than direct battery voltage, use an appropriate regulated supply.

## Physical construction

1. First prove the motor on a breadboard, powered and commanded from the controller.
2. Tape/heat-shrink the motor to a Velcro strap with the moving mass against the wrist.
3. Add strain relief to every wire; wrist movement will pull jumpers loose.
4. Keep the development board accessible for flashing and troubleshooting.
5. Carry a second motor, spare USB cable, and an external battery pack.

An exposed but tidy prototype is better than a beautiful enclosure that cannot be debugged.

## Hardware test checklist

- Device powers on after transport.
- Each named pattern is distinguishable through the strap.
- The motor runs for 30 minutes without a brownout or controller reset.
- Laptop reconnects to the device in under 30 seconds.
- USB serial fallback functions even if Bluetooth fails.
- A helper can wear it comfortably and feel each pattern over room noise.
