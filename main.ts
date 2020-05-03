namespace DHT11 {
    let _lastReadSuccessful: boolean = false
    let _temperature: number = undefined
    let _humidity: number = undefined
    
    export function measureData(dataPin: DigitalPin, pullUp: boolean): boolean {
        let startTime: number = undefined
        let endTime: number = undefined
        let dataArray: boolean[] = []
        let resultArray: number[] = []
        let checksum: number = undefined
        let checksumTmp: number = undefined
        for (let index = 0; index < 40; index++) dataArray.push(false)
        for (let index = 0; index < 5; index++) resultArray.push(0)
        _lastReadSuccessful = false
        _temperature = undefined
        _humidity = undefined

        // Start
        startTime = input.runningTimeMicros()
        pins.digitalWritePin(dataPin, 0)
        basic.pause(18)
        if (pullUp) pins.setPull(dataPin, PinPullMode.PullUp)
        pins.digitalReadPin(dataPin)
        control.waitMicros(20)
        while (pins.digitalReadPin(dataPin) == 1);
        while (pins.digitalReadPin(dataPin) == 0);
        while (pins.digitalReadPin(dataPin) == 1);

        // Read data (5 bytes)
        for (let index = 0; index < 40; index++) {
            while (pins.digitalReadPin(dataPin) == 1);
            while (pins.digitalReadPin(dataPin) == 0);
            control.waitMicros(28)
            // if sensor pull up data pin for more than 28 us it means 1, otherwise 0
            if (pins.digitalReadPin(dataPin) == 1) dataArray[index] = true
        }

        // Convert byte number array to integer
        for (let index = 0; index < 5; index++)
            for (let index2 = 0; index2 < 8; index2++)
                if (dataArray[8 * index + index2]) resultArray[index] += 2 ** (7 - index2)
        
        // Verify checksum
        checksumTmp = resultArray[0] + resultArray[1] + resultArray[2] + resultArray[3]
        checksum = resultArray[4]
        if (checksumTmp >= 512) checksumTmp -= 512
        if (checksumTmp >= 256) checksumTmp -= 256
        if (checksum == checksumTmp) _lastReadSuccessful = true
        endTime = input.runningTimeMicros()

        // Parse data if checksum ok
        if (_lastReadSuccessful) {
            // DHT11
            _humidity = resultArray[0] + resultArray[1] / 100
            _temperature = resultArray[2] + resultArray[3] / 100
        }
        basic.pause(1000)
        return _lastReadSuccessful
    }

    export function readData(data: MeasureType): number {
        return data == MeasureType.Humidity ? _humidity : _temperature
    }

    export function readDataSuccessful(): boolean {
        return _lastReadSuccessful
    }

    export enum MeasureType {
        Humidity,
        Temperature,
    }
}

function showDHT11Data() {
    DHT11.measureData(DigitalPin.P0, false)
    if (DHT11.readDataSuccessful()) {
        let temperature = DHT11.readData(DHT11.MeasureType.Temperature)
        let humidity = DHT11.readData(DHT11.MeasureType.Humidity)
        basic.showString(`T: ${temperature}*C - H: ${humidity}%`)
    }
}
