# underpass
A sampling companion for [Elektron Model:Samples™](https://www.elektron.se/products/modelsamples/) devices

## Value proposition
underpass adds the missing record button which turns your sample player into a sampler. Just plug it into the USB port of a computer or Android device running Google [Chrome](https://www.google.com/chrome/). Then sample from any audio input on your computer; or resample the output from your device without any loss of quality. 

## Usage
1. Pick a suitable host: a computer or Android device running Chrome. Sorry, iOS cannot be supported, as Apple have not implemented WebMIDI in their Safari browser and their underlying WebKit
2. Connect your device with the host using a suitable USB cable. My phone came with a USB-A to USB-C adapter, which works fine with the vendor provided cable. Or get a Micro-USB to USB-C cable
3. Power on your device
4. Open the underpass index.html file in your Chrome browser. Other browsers like Opera may work, but are untested
5. Select the appropriate audio input. Choose any line in to sample, or `Model:Samples` to resample the output of your device
6. Play some audio into your input. You shoud see the level meter moving
7. Hit record. You should see the duration timer counting up, while the level meter continues to move
8. Hit stop. You should see a progress bar for the transfer of the sample to your device counting up to 100%
9. On your device, push the sample selection button. Navigate to `inbox/0` and push the active trigger button to play it back
10. Rinse and repeat. Subsequent samples will be numbered 1, 2 and so on. Or choose your own number via the Sample ID input field

## Legal
This is free software licensed under [GNU GPL v3](./LICENSE). It comes without any warranty. Use entirely at your own risk.

All trademarks, registered trademarks, brand names, product names, company names and logos used in this application are the property of their respective owners. They are used for identification purposes only.

## Architecture
underpass is designed as a single page web application with HTML in [index.html](./index.html), scripting in [app.js](./app.js) and styling in [app.css](./app.css). It uses [WebRTC](https://webrtc.org/) to identify and select audio devices. Audio data is captured using [Web Audio](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) in 16-bit stereo at 48 kHz. This involves two [worklets](https://developers.google.com/web/updates/2017/12/audio-worklet) defined in [processors.js](./processors.js) which run in separate threads: a `RmsDbProcessor` which calculates [RMS](https://en.wikipedia.org/wiki/Root_mean_square) amplitude and converts this to [decibels](https://en.wikipedia.org/wiki/Decibel) for the level meter; and a `SavingProcessor` which stores the raw PCM data. Once recording completes, stored data are further processed in the main thread. This involves summing to mono, and converting it into sample dump packets as defined on p.35 of the [MIDI](https://www.midi.org/specifications/midi1-specifications/m1-v4-2-1-midi-1-0-detailed-specification-96-1-4) standard. These packets are transferred to the device using [WebMIDI](https://www.w3.org/TR/webmidi/). If you look closely, code for exporting samples in WAV format is there as well, but currently unused. No web programming frameworks were hurt building this app.   
