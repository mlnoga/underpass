/*  Underpass is Copyright (C) 2021 Markus Noga

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.   */

let audioContext; // Global audio context

// Audio devices
//
const audioInputSelect = document.querySelector('select#audioInput');
//const audioOutputSelect = document.querySelector('select#audioOutput');
const audioSelectors = [audioInputSelect /*, audioOutputSelect */];

function audioInputChanged() {
    const audioSource = audioInputSelect.value;
    var audioSourceName = "undefined";
    if(audioInputSelect.options[audioInputSelect.selectedIndex])
        audioSourceName=audioInputSelect.options[audioInputSelect.selectedIndex].text;
    console.log("New audio source: "+audioSourceName)
    const constraints = {
      audio: {
        deviceId: audioSource ? {exact: audioSource} : undefined,
        sampleRate : { exact: 48000 },
        sampleSize : { exact: 16 },
        // see https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackConstraints for additional options
      },
    };

    navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
        recorderInit(stream);
    }).catch((err) => {
        alert('Unable to access audio.\n\n' + err);
        console.log('Unable to access audio: ' + err);
    });
}
//audioInputSelect.onclick=audioInputChanged;
audioInputSelect.onchange=audioInputChanged;

function enumerateDevicesSuccess(deviceInfos) {
  // Store current selection if this is called multiple times
  const values = audioSelectors.map(select => select.value);
  // Clear out old options, if any
  audioSelectors.forEach(select => {
    while (select.firstChild) {
      select.removeChild(select.firstChild);
    }
  });
  // Populate options for each selector box
  for (let i = 0; i !== deviceInfos.length; ++i) {
    const deviceInfo = deviceInfos[i];
    const option = document.createElement('option');
    option.value = deviceInfo.deviceId;
    if (deviceInfo.kind === 'audioinput') {
      option.text = deviceInfo.label || `audio input ${audioInputSelect.length + 1}`;
      audioInputSelect.appendChild(option);
    } /* else if (deviceInfo.kind === 'audiooutput') {
      option.text = deviceInfo.label || `audio output ${audioOutputSelect.length + 1}`;
      audioOutputSelect.appendChild(option);
    } else */ {
      // console.log('Ignoring unknown device: ', deviceInfo);
    }
  }
  // Re-select previously selected options, if any, otherwise default to first Model:Samples entry
  audioSelectors.forEach((select, selectorIndex) => {
    const val=values[selectorIndex];
    select.value="";
    if(val) {
        for(var i=0; i<select.childNodes.length; i++) {
            const child=select.childNodes[i];
            if(child.value === val) {
                select.value=val;
                break;
            }
        }
    }
    if(!select.value) {
        for(var i=0; i<select.childNodes.length; i++) {
            const child=select.childNodes[i];
            if(child.text.includes("Model:Samples")) {
                select.value=child.value;
                break;
            }
        }
    }
    if(select.value!=val && select.onchange)
        select.onchange();
  });
}

navigator.mediaDevices.ondevicechange=function () {
  navigator.mediaDevices.enumerateDevices().then(enumerateDevicesSuccess).catch(function(err) {
      alert("Cannot select audio devices in this browser. Try Chrome. Error " + err.name + ": " + err.message)
  });
}
navigator.mediaDevices.ondevicechange();


// MIDI devices
// See https://www.midi.org/specifications/midi1-specifications/m1-v4-2-1-midi-1-0-detailed-specification-96-1-4
//

let midiAccess;     // Active MIDI access
let midiFromDevice; // Active MIDI input from the device
let midiToDevice;   // Active MIDI output to the device

const midiFromDeviceSelect = document.querySelector('select#midiFromDevice');
const midiToDeviceSelect = document.querySelector('select#midiToDevice');
const midiSelectors = [midiFromDeviceSelect, midiToDeviceSelect];


function midiFromDeviceChanged() {
    const sel=midiFromDeviceSelect.value;
    const oldMidiFromDevice=midiFromDevice;
    midiFromDevice=midiAccess.inputs.get(sel);
    if(oldMidiFromDevice && oldMidiFromDevice!==midiFromDevice)
        oldMidiFromDevice.onmidimessage=null;
    if(midiFromDevice) {
        console.log("New MIDI from device: "+midiFromDevice.name);
        midiFromDevice.onmidimessage=midiInputMessage;
    } else 
        console.log("No MIDI from device");
}

midiFromDeviceSelect.onclick=midiFromDeviceChanged
midiFromDeviceSelect.onchange=midiFromDeviceChanged
// Initial midiFromDeviceSelect.onchange() call from midiAccessSuccess()

function midiToDeviceChanged() {
    const sel=midiToDeviceSelect.value
    midiToDevice=midiAccess.outputs.get(sel);
    if(midiToDevice)
        console.log("New MIDI to device: "+midiToDevice.name);
    else
        console.log("No MIDI to device");
}

midiToDeviceSelect.onclick=midiToDeviceChanged
midiToDeviceSelect.onchange=midiToDeviceChanged
// Initial midiToDeviceSelect.onchange() call from midiAccessSuccess()


function midiAccessSuccess(ma) {
    midiAccess=ma;

    // Store current selection if this is called multiple times
    const values = midiSelectors.map(select => select.value);
    // Clear out old options, if any
    midiSelectors.forEach(select => {
        while (select.firstChild) {
            select.removeChild(select.firstChild);
        }
    });
    // Populate new options for each selector box
    ma.inputs.forEach( function(key,port) {
        const option = document.createElement('option');
        option.value = port;
        option.text = key.name;
        midiFromDeviceSelect.appendChild(option);
    })
    ma.outputs.forEach( function(key,port) {
        const option = document.createElement('option');
        option.value = port;
        option.text = key.name;
        midiToDeviceSelect.appendChild(option);
    })
    // Re-select previously selected options, if any, otherwise default to first Model:Samples entry
    midiSelectors.forEach((select, selectorIndex) => {
        const val=values[selectorIndex];
        select.value="";
        if(val) {
            for(var i=0; i<select.childNodes.length; i++) {
                const child=select.childNodes[i];
                if(child.value === val) {
                    select.value=val;
                    break;
                }
            }
        }
        if(!select.value) {
            for(var i=0; i<select.childNodes.length; i++) {
                const child=select.childNodes[i];
                if(child.text.includes("Model:Samples")) {
                    select.value=child.value;
                    break;
                }
            }
        }
        if(select.value !== val && select.onchange) 
            select.onchange();
    });

    midiAccess.onstatechange=function() { midiAccessSuccess(midiAccess) }
}

navigator.requestMIDIAccess({ sysex : true }).then(midiAccessSuccess).catch(function(err) {
  alert("Cannot select MIDI devices in this browser. Try Chrome. Error " + err.name + ": " + err.message)
});

var midiSampleDumpPackets;
var midiSampleDumpPacketsTotal=0;
var midiSampleDumpPacketsSent=0;
var midiSampleDumpPacketsAcknowledged=0;

function midiInputMessage(event) {
    //console.log("MIDI received "+midiMessageToString(event.data));

    const d=event.data;
    if(d.length!=6 || d[0]!=0xf0 || d[1]!=0x7e || d[2]!=0x00 && d[5]!=0xf7) {
        console.log("Ignoring unknown MIDI message "+midiMessageToString(d));
        return;
    }
    if(d[3]==0x7f) { // ack
        midiSampleDumpPacketsAcknowledged++;
        const progress=midiSampleDumpPacketsAcknowledged/midiSampleDumpPacketsTotal;
        //console.log("Progress: "+progress+" with "+midiSampleDumpPacketsAcknowledged+" of "+midiSampleDumpPacketsSent);
        recorderShowMidiSDProgress(progress);

        if(midiSampleDumpPacketsSent<midiSampleDumpPacketsTotal) {
            midiToDevice.send(midiSampleDumpPackets[midiSampleDumpPacketsSent-1]); // packet 0 is the header
            midiSampleDumpPacketsSent++;
        } else if(recCurStatusNode.textContent != "Uploaded") {
            console.log("Data transfer complete");
            recCurStatusNode.textContent = "Uploaded";
            recButton.disabled=false;
            stopButton.disabled=true;
            stopButton.style.background = "";
            sampleID.value=parseInt(sampleID.value)+1;
        } else {
            ; // ignore
        }
    } else if(d[3]==0x7c) { // wait
        ; // ignore
    } else {
        console.log("Ignoring unknown MIDI message "+midiMessageToString(d));
        return;
    }
}

function midiSendSampleDump(sampleNumber, sampleRate, samples) {
    let header =newMidiSDHeader(0, sampleNumber, 16, sampleRate, samples.length, 0, samples.length-1, 0x7f);
    let packets=newMidiSDDataPackets(0, 16, samples);

    recorderShowMidiSDProgress(0);
    midiSampleDumpPackets=packets;
    midiSampleDumpPacketsTotal=packets.length+1; 
    midiSampleDumpPacketsSent=1; 
    midiSampleDumpPacketsAcknowledged=0;
    midiToDevice.send(header);
    // body packets are sent asynchronously, returns immediately after sending header
}

function newMidiSDHeader(deviceID, sampleNumber, sampleBits, sampleRate, sampleLength, loopStart, loopEnd, loopType) {
    let samplePeriod = 1000000000 / sampleRate;
    let header = new Uint8Array(21);
    header[ 0]= 0xf0;                        // begin system exclusive
    header[ 1]= 0x7e;                        // sample dump
    header[ 2]= deviceID            & 0x7f;  // device ID
    header[ 3]= 0x01;                        // header
    header[ 4]= sampleNumber        & 0x7f;  // sample number lsb 
    header[ 5]=(sampleNumber >>  7) & 0x7f;  // sample number msb 
    header[ 6]= sampleBits          & 0x7f;  // sample format, length in bits
    header[ 7]= samplePeriod        & 0x7f;  // sample period, lsb first 
    header[ 8]=(samplePeriod >>  7) & 0x7f;  //  
    header[ 9]=(samplePeriod >> 14) & 0x7f;  // 
    header[10]= sampleLength        & 0x7f;  // sample length, lsb first 
    header[11]=(sampleLength >>  7) & 0x7f;  // 
    header[12]=(sampleLength >> 14) & 0x7f;  // 
    header[13]= loopStart           & 0x7f;  // loop start, lsb first 
    header[14]=(loopStart    >>  7) & 0x7f;  // 
    header[15]=(loopStart    >> 14) & 0x7f;  // 
    header[16]= loopEnd             & 0x7f;  // loop end, lsb first 
    header[17]=(loopEnd      >>  7) & 0x7f;  // 
    header[18]=(loopEnd      >> 14) & 0x7f;  // 
    header[19]= loopType            & 0x7f;  // loop type, 0=fwd, 1=back/fwd, 7f=0ff 
    header[20]= 0xf7;                        // end system exclusive 
    return header;
}

function newMidiSDDataPackets(deviceID, sampleBits, samples) {
    let packets =[];

    let saIndex =0;
    while(saIndex<samples.length) {
        let packet=new Uint8Array(127);
        let packetID=packets.length;
        let pIndex=0;

        packet[pIndex++]=0xf0;            // begin system exclusive
        packet[pIndex++]=0x7e;            // sample dump
        packet[pIndex++]=deviceID & 0x7f; // device ID
        packet[pIndex++]=0x02;            // data packet
        packet[pIndex++]=packetID & 0x7f; // packet ID lsb (msb not transmitted)

        // build package body of 120 bytes until total length of body + header = 125 reached.
        // 120 is divisible by 1,2,3 and 4, so all normal sample lengths divide into the
        // package body evenly, without a remainder splitting into the next packet. 
        while (pIndex<125) {
            // pad last packet with zeros if necessary
            let sampleFloat=saIndex<samples.length ? samples[saIndex++] : 0;

            // convert sample value into PCM representation from 0..1
            let sampleFloatClamped=(Math.max(-1, Math.min(1, sampleFloat ))+1)*0.5;
            let sampleUnsigned=(((1<<(sampleBits))-1) * sampleFloatClamped ).toFixed();
            let bitsRemaining=sampleBits;

            // Pad on the right to split evenly into 7-bit MIDI values
            let shiftNeeded=(7 - (bitsRemaining % 7)) % 7;
            sampleUnsigned<<=shiftNeeded;
            bitsRemaining+=shiftNeeded; 

            // Add to packet a sequence of 7-bit MIDI values
            while(bitsRemaining>0) {
                let pDatum=(sampleUnsigned >> (bitsRemaining - 7)) & 0x7f; 
                packet[pIndex++]=pDatum;
                bitsRemaining-=7;
            }
        }

        let checksum=0;
        for(let i=1; i<pIndex; i++)
            checksum ^= packet[i];

        packet[pIndex++]=checksum & 0x7f; // checksum
        packet[pIndex++]=0xf7;            // end system exclusive     

        packets.push(packet);
    }

    return packets;
}

function midiMessageToString(p) {
    if(p.length==0)
        return "";
    var buf=p[0].toString(16);
    for(var i=1; i<p.length; i++)
        buf=buf.concat(" "+p[i].toString(16));
    return buf;
}


// Level meter
//

const levelMeterSpan  = document.querySelector('span#levelMeterInner');

function levelMeterShow(db) {
    // translate -92 ... +20 db to %
    const perc=100*((db+92)/(92+20));
    levelMeterSpan.style.width=perc + "%"
    //levelMeterSpan.textContent=Math.floor(db);
}


// Audio recorder 
//

const recButton  = document.querySelector('button#record');
const stopButton = document.querySelector('button#stop');

recButton.onclick =recorderStart;
stopButton.onclick=recorderStop;
stopButton.disabled=true;

const sampleIDSelect = document.querySelector('input#sampleID');

const recTable = document.querySelector('table#recordings');
const recTrPrototype = document.querySelector('tr#recordingPrototype');


var recCurNode=null;
var recCurFileNameNode=null;
var recCurDurationNode=null;
var recCurStatusNode=null;
var recCurProgressInnerNode=null;

let recSourceNode=null;
let recRmsDbNode=null;
let recSavingNode=null;

let recBuffers = [[], []];
let recLength = 0;
let numChannels = 2;
let timeout = null;
let maxTime=10;


function recorderInit(stream) {
    recorderShutdown();
    audioContext = new AudioContext();
    document.addEventListener('unload', recorderShutdown);

    recSourceNode = audioContext.createMediaStreamSource(stream);

    audioContext.audioWorklet.addModule('processors.js').then(() => {
        recRmsDbNode = new AudioWorkletNode(audioContext, 'rms-db-processor');
        recRmsDbNode.port.onmessage = (event) => {
            levelMeterShow(event.data);
        };
        recSourceNode.connect(recRmsDbNode);
        recRmsDbNode.connect(audioContext.destination);

        recSavingNode = new AudioWorkletNode(audioContext, 'saving-processor');
        recSavingNode.port.onmessage = (event) => {
            const channels=event.data;
            for(var i=0; i<channels.length; i++) {
                const channel=channels[i];
                recBuffers[i].push(channel);
                if(i==0)
                    recLength+=channel.length;
            }
            recorderShowDuration(recLength); 
        };
    });
}

function recorderShutdown(stream) {
    if(audioContext) {
        audioContext.close();
        audioContext=null;
    }
}

function recorderStart() {
    // create new recordings node 
    recCurNode=recTrPrototype.cloneNode(true);
    recCurNode.removeAttribute("id");
    recCurFileNameNode=recCurNode.getElementsByClassName("recFileName")[0];
    recCurFileNameNode.textContent="inbox/"+sampleID.value;
    recCurDurationNode=recCurNode.getElementsByClassName("recDuration")[0];
    recCurStatusNode=recCurNode.getElementsByClassName("recStatus")[0];
    recCurProgressInnerNode=recCurNode.getElementsByClassName("progressInner")[0];

    // insert at top of the recordings list, dropping at the bottom if necessary
    if(!recTable.childNodes || recTable.childNodes.length===0)
        recTable.appendChild(recCurNode);
    else
        recTable.insertBefore(recCurNode, recTable.childNodes[0]);
    if(recTable.childNodes.length>6)
        recTable.removeChild(recTable.childNodes[recTable.childNodes.length-1])

    // start actual recording
    recorderShowDuration(0);
    recBuffers = [[], []];
    recLength = 0;
    recSourceNode.connect(recSavingNode);
    recSavingNode.connect(audioContext.destination);

    timeout = setTimeout(() => {
        recorderStop();
    }, maxTime*audioContext.sampleRate);

    // update UI buttons
    recButton.style.background = "#f6660f";
    recButton.disabled=true;
    stopButton.disabled=false;
}

function sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
}

function recorderStop() {
    clearTimeout(timeout);
    timeout = null;

    recSourceNode.disconnect(recSavingNode);
    recSavingNode.disconnect(audioContext.destination);
    sleep(100); // wait for events to catch up

    recButton.style.background = "";
    stopButton.style.background = "#f6660f";
    recCurStatusNode.textContent= "Uploading...";

    let buffers= numChannels == 2 ? [mergeBuffers(recBuffers[0], recLength), mergeBuffers(recBuffers[0], recLength)] : [mergeBuffers(recBuffers[0], recLength)];
    let monosummed = numChannels == 2 ? monosum(buffers[0], buffers[1]) : buffers[0];
    console.log("Captured " + monosummed.length + " samples");

    if(midiToDevice) {
        midiSendSampleDump(sampleID.value, audioContext.sampleRate, monosummed);
    } else
        alert("No midi output device");

    // const d=new Date();
    // const wavFileName = str2(d.getFullYear())+ str2(d.getMonth()+1) + str2(d.getDate()) +"-" + str2(d.getHours()) + str2(d.getMinutes()) + str2(d.getSeconds()) + '.wav';
    // var blob=exportWAV(wavFileName, 1, audioContext.sampleRate, samples);
    // var url = URL.createObjectURL(blob);
    // console.log("Opening "+blob.name);
    // window.open(url,'_blank')
}


function recorderShowDuration(numSamples) { 
    const duration=numSamples/audioContext.sampleRate;
    const minutes=Math.floor(duration/60);
    const seconds=Math.floor(duration - 60*minutes);
    const millis =Math.floor(1000*(duration - 60*minutes - seconds));
    const pretty= str2(minutes) + ":" + str2(seconds) + "." + str3(millis);

    recCurDurationNode.textContent= pretty;
}


function recorderShowMidiSDProgress(value) { 
    if(value==0)
        recCurProgressInnerNode.style.backgroundColor="#f6660f";
    else if(value>1)
        value=1;

    recCurProgressInnerNode.style.width=(100*value)+"%";
    recCurProgressInnerNode.textContent=Math.floor(100*value)+"%"; 
    if(Math.floor(10000*value)==10000) {
        recCurProgressInnerNode.style.backgroundColor="slategray";
    }
}


function mergeBuffers(recBuffers, recLength) {
    let result = new Float32Array(recLength);
    let offset = 0;
    for (let i = 0; i < recBuffers.length; i++) {
        result.set(recBuffers[i], offset);
        offset += recBuffers[i].length;
    }
    return result;
}


function interleave(inputL, inputR) {
    let len = inputL.length + inputR.length;
    let result = new Float32Array(len);
    let index = 0;
    let inputIndex = 0;

    while (index < len) {
        result[index++] = inputL[inputIndex  ];
        result[index++] = inputR[inputIndex++];
    }
    return result;
}


function monosum(inputL, inputR) {
    let len = inputL.length;
    let result = new Float32Array(len);

    for(let i=0; i<len; i++) {
        result[i] = 0.5 * ( inputL[i] + inputR[i] );
    }
    return result;
}

function recShowLegal() {
    alert("Underpass (C) 2021 by Markus Noga. Use at your own risk. This is free software distributed without any warranty under GNU GPL v3, see https://www.gnu.org/licenses/. All trademarks, names, logos, or company names are the property of their respective owners, and are used for identification only.");
}


// .wav file exporter
//

function exportWAV(fileName, numChannels, sampleRate, samples) {
    let dataView = encodeWAV(1, audioContext.sampleRate, samples);
    let blob = new Blob([ dataView ], { type: 'audio/wav' });
    blob.name = fileName;
    return blob;
}

function encodeWAV(numChannels, sampleRate, samples){
    var buffer = new ArrayBuffer(44 + samples.length * 2);
    var view = new DataView(buffer);

    writeString(view, 0, 'RIFF');                     // RIFF identifier
    view.setUint32(4, 36 + samples.length * 2, true); // file length
    writeString(view, 8, 'WAVE');                     // RIFF type
    writeString(view, 12, 'fmt ');                    // format chunk identifier
    view.setUint32(16, 16, true);                     // format chunk length
    view.setUint16(20, 1, true);                      // sample format (raw)
    view.setUint16(22, numChannels, true);            // channel count
    view.setUint32(24, audioContext.sampleRate, true);     // sample rate
    view.setUint32(28, audioContext.sampleRate * 4, true); // byte rate (sample rate * block align)
    view.setUint16(32, numChannels * 2, true);        // block align (channel count * bytes per sample)
    view.setUint16(34, 16, true);                     // bits per sample
    writeString(view, 36, 'data');                    // data chunk identifier
    view.setUint32(40, samples.length * 2, true);     // data chunk length
    floatTo16BitPCM(view, 44, samples);

    return view;
}

function writeString(view, offset, string){
    for (var i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

function floatTo16BitPCM(output, offset, input){
    for (var i = 0; i < input.length; i++, offset+=2){
        var s = Math.max(-1, Math.min(1, input[i]));
        output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
}

function str2(n) {
    if(n>100) { 
       n=n % 100;
    }
    return n<10 ? ("0" + n.toString()) : n.toString();
}

function str3(n) {
    if(n>1000) { 
       n=n % 1000;
    }
    return n<10 ? ("00" + n.toString()) : (n<100 ? ("0" + n.toString()) : n.toString());
}


// Legal notice
//

const legalButton = document.querySelector('td#legalButton');
const legalNotice = document.querySelector('table#legalNotice');
const legalCloseButton = document.querySelector('i#legalClose');

legalButton.onclick = function() {
    if(legalNotice.style.display==="block")
        legalNotice.style.display="none";
    else
        legalNotice.style.display="block";
}

legalCloseButton.onclick = function() {
    legalNotice.style.display="none";
}


