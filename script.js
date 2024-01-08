
function byteString(n)
{
    if(n < 0 || n > 255 || n % 1 !== 0)
    {
        throw new Error(n + " does not fit in a byte");
    }
    return ("00000000" + n.toString(2)).slice(-8)
}

function _12BitString(n)
{
    if(n < 0 || n > 4095 || n % 1 !== 0)
    {
        throw new Error(n + " does not fit into a byte and a nibble");
    }
    return ("000000000000" + n.toString(2)).slice(-12);
}

function twoByteString(n)
{
    if(n < 0 || n > 65535 || n % 1 !== 0)
    {
        throw new Error(n + " does not fit in two bytes");
    }
    return ("0000000000000000" + n.toString(2)).slice(-16)
}

function decrementDnS()
{
    if(parseInt(delayTimer, 2) > 0)
    {
        let temp = parseInt(delayTimer, 2) - 1;
        delayTimer = delayTimer >= 0 ? byteString(temp) : byteString(0);
    }
    if(parseInt(soundTimer, 2) > 0)
    {
        buzz = true;
        let temp = parseInt(soundTimer, 2) - 1;
        soundTimer = soundTimer >= 0 ? byteString(temp) : byteString(0);
    }
    else
    {
        buzz = false;
    }

    if(buzz)
    {
        beep();
    }
}

function push(value)
{
    stack[stackPointer] = value;
    stackPointer--;
    if(stackPointer < 0)
    {
        throw new Error("Stack overflow! Tried to push " + value + " to stack.\nStack dump: \n" + stack);
    }
}

function pop()
{
    stackPointer++;
    if(stackPointer > stack.length - 1)
    {
        throw new Error("Stack underflow! Tried to pop from an empty stack.");
    }
    return stack[stackPointer];
}

function skipInstruction()
{
    let temp = parseInt(programCounter, 2) + 2;
    programCounter = _12BitString(temp);
}

function prevInstruction()
{
    let temp = parseInt(programCounter, 2) - 2;
    programCounter = _12BitString(temp);
}

function setCarryBit(val)
{
    registers[parseInt("F", 16)] = byteString(val);
}

function subtract(x, y)
{
    setCarryBit(1);
    let overflow = 0;
    let temp = parseInt(registers[parseInt(x, 16)], 2) - parseInt(registers[parseInt(y, 16)], 2);
    if(temp < 0)
    {
        setCarryBit(0);
        overflow = 256;
    }
    registers[parseInt(y, 16)] = byteString(temp + overflow);
}

function beep()
{
    document.getElementById('beep').play(); 
}

function setFont()
{
    let font = 
    [
        [0xF0, 0x90, 0x90, 0x90, 0xF0], // 0
        [0x20, 0x60, 0x20, 0x20, 0x70], // 1
        [0xF0, 0x10, 0xF0, 0x80, 0xF0], // 2
        [0xF0, 0x10, 0xF0, 0x10, 0xF0], // 3
        [0x90, 0x90, 0xF0, 0x10, 0x10], // 4
        [0xF0, 0x80, 0xF0, 0x10, 0xF0], // 5
        [0xF0, 0x80, 0xF0, 0x90, 0xF0], // 6
        [0xF0, 0x10, 0x20, 0x40, 0x40], // 7
        [0xF0, 0x90, 0xF0, 0x90, 0xF0], // 8
        [0xF0, 0x90, 0xF0, 0x10, 0xF0], // 9
        [0xF0, 0x90, 0xF0, 0x90, 0x90], // A
        [0xE0, 0x90, 0xE0, 0x90, 0xE0], // B
        [0xF0, 0x80, 0x80, 0x80, 0xF0], // C
        [0xE0, 0x90, 0x90, 0x90, 0xE0], // D
        [0xF0, 0x80, 0xF0, 0x80, 0xF0], // E
        [0xF0, 0x80, 0xF0, 0x80, 0x80]  // F
    ];

    let address = 80

    for(let i = 0; i < 16; i++)
    {
        for(let k = 0;k<5;k++)
        {
            memory[address] = byteString(font[i][k]);
            address++;
        }
    }
}

function getFont(letter)
{
    let fontMap = 
    {
        '0': 0x050,
        '1': 0x055,
        '2': 0x05a,
        '3': 0x05f,
        '4': 0x064,
        '5': 0x069,
        '6': 0x06e,
        '7': 0x073,
        '8': 0x078,
        '9': 0x07d,
        'a': 0x082,
        'b': 0x087,
        'c': 0x08c,
        'd': 0x091,
        'e': 0x096,
        'f': 0x09b
    }

    return fontMap[letter];
}

function drawScreen()
{
    let context = document.getElementById('screen').getContext('2d')
    for(let y = 0;y<screenHeight;y++)
    {
        for(let x = 0;x<screenWidth;x++)
        {
            if(screen[(y*64)+x] == 0)
            {
                context.fillStyle = '#FFFFFF' 
            }
            else
            {
                context.fillStyle = '#000000' 
            }
            context.fillRect(x, y, 1, 1);
        }
    }
}


function main()
{
    ////////////////// FETCH //////////////////
    // Get first two bytes
    let currentOP = memory[parseInt(programCounter, 2)];
    currentOP += memory[parseInt(programCounter, 2) + 1];
    // Increment PC by 2
    skipInstruction();
    ///////////////// DECODE //////////////////
    // These are all hex
    let firstNibble = parseInt(currentOP.slice(0,4), 2).toString(16);
    let X = parseInt(currentOP.slice(4,8), 2).toString(16);
    let Y = parseInt(currentOP.slice(8,12), 2).toString(16);
    let N = parseInt(currentOP.slice(12,16), 2).toString(16);
    let KK = Y + N;
    let NNN = X + Y + N;
    currentOP = parseInt(currentOP, 2).toString(16);
    ///////////////// EXECUTE /////////////////
    switch(currentOP)
    {
        case "00e0":
            // clear screen
            screen.fill(0);
            drawScreen();
            break;
        case "00ee":
            // pop from stack
            programCounter = pop();
            break;
        case `1${NNN}`:
            // Jump
            programCounter = _12BitString(parseInt(NNN, 16));
            break;
        case `2${NNN}`:
            // Subroutine
            push(programCounter);
            programCounter = _12BitString(parseInt(NNN, 16));
            break;
        case `3${X}${KK}`:
            // skip if vx = nn
            if(registers[parseInt(X, 16)] == parseInt(KK, 16))
            {
                skipInstruction();
            }
            break;
        case `4${X}${KK}`:
            // skip if vx != nn
            if(registers[parseInt(X, 16)] != parseInt(KK, 16))
            {
                skipInstruction();
            }
            break;
        case `5${X}${Y}0`:
            // skip if vx == vy
            if(registers[parseInt(X, 16)] == registers[parseInt(Y, 16)])
            {
                skipInstruction();
            }
            break;
        case `6${X}${KK}`:
            // x=kk
            registers[parseInt(X, 16)] = byteString(parseInt(KK, 16));
            break;
        case `7${X}${KK}`:
            // x + kk, store in x, don't set carry
            let temp = parseInt(registers[parseInt(X, 16)], 2);
            let temp2 = temp + parseInt(KK, 16);
            registers[parseInt(X, 16)] = temp2 > 255 ? byteString(255) : byteString(temp2);
            break;
        case `8${X}${Y}0`:
            // x=y
            registers[parseInt(X, 16)] = registers[parseInt(Y, 16)];
            break;
        case `8${X}${Y}1`:
            // x or y
            registers[parseInt(X, 16)] = byteString(parseInt(registers[parseInt(X, 16)], 2) | parseInt(registers[parseInt(Y, 16)]), 2);
            break;
        case `8${X}${Y}2`:
            // x and y
            registers[parseInt(X, 16)] = byteString(parseInt(registers[parseInt(X, 16)], 2) & parseInt(registers[parseInt(Y, 16)]), 2);
            break;
        case `8${X}${Y}3`:
            // x xor y
            registers[parseInt(X, 16)] = byteString(parseInt(registers[parseInt(X, 16)], 2) ^ parseInt(registers[parseInt(Y, 16)]), 2);
            break;
        case `8${X}${Y}4`:
            // x+y, store in x, set carry
            let temp8xy4 = parseInt(registers[parseInt(X, 16)], 2) + parseInt(registers[parseInt(Y, 16)], 2);
            if(temp8xy4 > 255)
            {
                // Overflow
                registers[parseInt(X, 16)] = byteString(temp8xy4 - 256);
                setCarryBit(1);
            }
            else
            {
                registers[parseInt(X, 16)] = byteString(temp8xy4);
                setCarryBit(0);
            }
            break;
        case `8${X}${Y}5`:
            // vx - vy, store in vx
            subtract(X, Y);
            break;
        case `8${X}${Y}6`:
            // Shift right
            if(ambiguousShift)
            {
                registers[parseInt(X, 16)] = registers[parseInt(Y, 16)]
            }
            setCarryBit(byteString(byteString(registers[parseInt(X, 16)]).slice(-1)));
            registers[parseInt(X, 16)] = byteString(parseInt(registers[parseInt(X, 16)], 2) >> 1);
            break;
        case `8${X}${Y}7`:
                // vy - vx, store in vx
                subtract(Y, X);
                break;
        case `8${X}${Y}e`:
            // Shift left
            if(ambiguousShift)
            {
                registers[parseInt(X, 16)] = registers[parseInt(Y, 16)]
            }
            setCarryBit(byteString(byteString(registers[parseInt(X, 16)]).slice(0, 1)));
            registers[parseInt(X, 16)] = byteString(parseInt(registers[parseInt(X, 16)], 2) << 1);
            break;
        case `9${X}${Y}0`:
            // skip if vx != vy
            if(registers[parseInt(X, 16)] != registers[parseInt(Y, 16)])
            {
                skipInstruction();
            }
            break;
        case `a${NNN}`:
            // I=nnn
            indexRegister = byteString(parseInt(NNN, 16));
            break;
        case `b${NNN}`:
            // I=NNN+v0
            if(ambiguousBNNN)
            {
                indexRegister = byteString(parseInt(NNN, 16) + parseInt(registers[0], 2));
            }
            // I=NNN+vX
            else
            {
                indexRegister = byteString(parseInt(NNN, 16) + parseInt(registers[parseInt(X, 16)], 2));
            }
            break;
        case `c${X}${KK}`:
            // random and kk, store in x
            let randcxkk = Math.floor(256 * Math.random());
            let tempcxkk = randcxkk & parseInt(KK, 16);
            registers[parseInt(X, 16)] = byteString(tempcxkk);
            break;
        case `d${X}${Y}${N}`:
            // draw to screen
            let dxynX = parseInt(registers[parseInt(X, 16)], 2) % screenWidth;
            let dxynY = parseInt(registers[parseInt(Y, 16)], 2) % screenHeight;
            setCarryBit(0);
            for(let i = indexRegister;i<N;i++)
            {
                if(dxynX > screenWidth || dxynY > screenHeight)
                {
                    break;
                }
                let currentByte = memory[parseInt(i, 16)].split("");
                for(let k = 0;k < currentByte.length;k++)
                {
                    if(screen[dxynX + (64 * dxynY)] == 1 && currentByte[k] == 1)
                    {
                        screen[dxynX + (64 * dxynY)] = 0;
                        setCarryBit(1);
                    }
                    else if(screen[dxynX + (64 * dxynY)] == 0 && currentByte[k] == 1)
                    {
                        screen[dxynX + (64 * dxynY)] = 1;
                        dxynX++;
                    }
                }
                dxynY++;
            }
            break;
        case `e${X}9e`:
            // skip if key=vx
            if(parseInt(registers[parseInt(X, 16)], 2) == keyPressed)
            {
                skipInstruction();
            }
            break;
        case `e${X}a1`:
            // skip if key!=vx
            if(parseInt(registers[parseInt(X, 16)], 2) != keyPressed)
            {
                skipInstruction();
            }
            break;
        case `f${X}07`:
            // vx = delaytimer
            registers[parseInt(X, 16)] = delayTimer;
            break;
        case `f${X}0a`:
            // get key
            prevInstruction()
            for(let ifx0a = false;ifx0a==false;)
            {
                if(typeof keyPressed === 'number')
                {
                    registers[parseInt(X, 16)] = byteString(keyPressed);
                    ifx0a = true;
                }
            }
            break;
        case `f${X}15`:
            // delaytimer = vx
            delayTimer = registers[parseInt(X, 16)];
            break;
        case `f${X}18`:
            // soundtimer = vx
            soundTimer = registers[parseInt(X, 16)];
            break;
        case `f${X}1e`:
            // vx + indexreg, store in indexreg
            let tempfx1e = parseInt(registers[parseInt(X, 16)], 2) + parseInt(indexRegister, 2);
            setCarryBit(tempfx1e > parseInt('0FFF', 16) ? 1 : 0); 
            indexRegister = byteString(tempfx1e);
            break;
        case `f${X}29`:
            // font character
            indexRegister = byteString(getFont(registers[parseInt(X, 16)]));
            break;
        case `f${X}33`:
            let tempfx33 = `${parseInt(registers[parseInt(X, 16)], 2)}`;
            tempfx33 = tempfx33.length == 3 ? tempfx33 : tempfx33.length == 2 ? `0${tempfx33}` : `00${tempfx33}`;
            let tempfx331 = tempfx33.slice(0, 1);
            let tempfx332 = tempfx33.slice(1, 2);
            let tempfx333 = tempfx33.slice(2, 3);
            
            memory[parseInt(indexRegister, 2)] = byteString(tempfx331);
            memory[parseInt(indexRegister, 2) + 1] = byteString(tempfx332);
            memory[parseInt(indexRegister, 2) + 2] = byteString(tempfx333);
            break;
        case `f${X}55`:
            // store registers to memory
            for(let fx55i = 0;fx55i<X;fx55i++)
            {
                memory[parseInt(indexRegister, 2) + fx55i] = registers[parseInt(fx55i, 16)];
            }
            break;
        case `f${X}65`:
            // load from memory to registers
            for(let fx65i = 0;fx65i<X;fx65i++)
            {
                registers[parseInt(fx65i, 16)] = memory[parseInt(indexRegister, 2) + fx65i];
            }

            if(ambiguousSLMem)
            {
                indexRegister = byteString(parseInt(indexRegister, 2) + parseInt(X, 16) + 1);
            }
            break;
    }
}

function init()
{
    // more init stuff
    setFont();
}

function loadGame()
{
    let fileReader = FileReader();
    fileReader.readAsBinaryString('test_opcode.ch8');
    // 512-4095
}

var screenWidth = 64;
var screenHeight = 32;

var screen = new Array(2048).fill(0);

var ambiguousShift = true;
var ambiguousBNNN = false;
var ambiguousSLMem = false;

var memory = new Array(4096).fill(byteString(0));

var registers = new Array(16).fill(byteString(0));
var indexRegister = byteString(0);
var programCounter = _12BitString(0);

var stack = new Array(48).fill(_12BitString(0));
var stackPointer = stack.length - 1;

var delayTimer = byteString(0);
var soundTimer = byteString(0);
var buzz = false;

var opcodes = new Array(35).fill(twoByteString(0));
var keyPressed = false;

setInterval(decrementDnS, 16);

document.addEventListener("keyup", (event) => {
    keyPressed = false;
});
document.addEventListener("keydown", (event) => {
    if (event.isComposing || event.keyCode === 229) {
      return;
    }
    switch(event.keyCode)
    {
        case 49:
            keyPressed = 0;
            break;
        case 50:
            keyPressed = 1;
            break;
        case 51:
            keyPressed = 2;
            break;
        case 52:
            keyPressed = 3;
            break;
        case 81:
            keyPressed = 4;
            break;
        case 87:
            keyPressed = 5;
            break;
        case 69:
            keyPressed = 6;
            break;
        case 82:
            keyPressed = 7;
            break;
        case 65:
            keyPressed = 8;
            break;
        case 83:
            keyPressed = 9;
            break;
        case 68:
            keyPressed = 10;
            break;
        case 70:
            keyPressed = 11;
            break;
        case 90:
            keyPressed = 12;
            break;
        case 88:
            keyPressed = 13;
            break;
        case 67:
            keyPressed = 14;
            break;
        case 86:
            keyPressed = 15;
            break;
    }
});