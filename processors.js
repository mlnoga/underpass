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

class RmsDbProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.port.onmessage = function(event) {
      // Ignore incoming data from the node
      console.log("AudioWorkletProcessor received event: "+event);
    }
  }

  process(inputs, outputs, parameters) {
    const input=inputs[0];
    var rmsSumofChannels=0;

    // calculate RMS per channel, updating running sum of channels
    for (var i = 0; i < input.length; i++) {
        const channel=input[i];
        var   sqSum=0;
        for(var j=0; j<channel.length; j++) {
            const val=channel[j];
            sqSum+=val*val;
        }
        const rms=Math.sqrt(sqSum/channel.length);
        rmsSumofChannels+=rms;
    }

    // calculate average RMS across channels
    const rmsAverage=rmsSumofChannels/input.length;
    const db=20*Math.log10(Math.max(rmsAverage, 1/32768));

    // message the audio worklet in the main context
    this.port.postMessage(db);

    return true;
  }
}

registerProcessor('rms-db-processor', RmsDbProcessor);


class SavingProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.port.onmessage = function(event) {
      // Ignore incoming data from the node
      console.log("AudioWorkletProcessor received event: "+event);
    }
  }

  process(inputs, outputs, parameters) {
    const input=inputs[0];

    if(input.length==0)
      return true;

    // deep copy all channels, so the next iteration doesn't overwrite the buffer
    var   channelClones=[];
    for (var i = 0; i < input.length; i++) {
        const channel=input[i];
        channelClones.push(new Float32Array(channel)); 
    }

    // message the audio worklet in the main context
    this.port.postMessage(channelClones);

    return true;
  }
}

registerProcessor('saving-processor', SavingProcessor);
