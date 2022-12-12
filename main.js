/*Implement an architectural simulator capable of assessing the performance of a simplified out-of-order 16-bit RISC processor that uses Tomasulo’s algorithm without speculation. 
The simulator should simulate the program’s execution on a single-issue processor (multiple-issue simulation is a bonus feature). It should follow the non-speculative version of Tomasulo’s algorithm. The simulator should only take the 3 backend stages into account: issue (1 cycle), execute (N cycles depending on the functional unit involved as detailed in the table below), and write (1 cycle).
Simulator output: At the end, the simulator should display the following performance metrics:
1. A table listing the clock cycle time at which each instruction was: issued, started execution, finished
execution, and was written
2. The total execution time expressed as the number of cycles spanned
3. The IPC
4. The branch misprediction percentage
Simplifying assumptions:
1. Fetching and decoding take 0 cycles and the instruction queue is already filled with all the instructions to be simulated.
2. No floating-point instructions, registers, or functional units
3. No input/output instructions are supported
4. No interrupts or exceptions are to be handled
5. For each program being executed, assume that the program and its data are fully loaded in the main
memory
6. There is a one-to-one mapping between reservation stations and functional units. i.e., Each reservation
station has a functional unit dedicated to it
7. No cache or virtual memory 
The simulator supports LW, SW, MUL, add, addi, Beq, jal, return,NEG,NOR instructions.
*/

function start() {
  const code = document.getElementById("code").value;
  parser(code);
}

class Instruction {
  constructor({
    type,
    destinationRegister,
    sourceRegister1,
    sourceRegister2,
    immediate,
    pc,
    label,
  }) {
    this.type = type;
    this.destinationRegister = destinationRegister;
    this.sourceRegister1 = sourceRegister1;
    this.sourceRegister2 = sourceRegister2;
    this.immediate = immediate;
    this.pc = pc;
    this.label = label;

    this.issueCycle = null;
    this.executeCycle = null;
    this.writeCycle = null;

    //may be used in the future
    this.reservationStation = null;
    this.executed = false;
    this.written = false;
  }
}

const InstructionType = {
  LW: "LW",
  SW: "SW",
  MUL: "MUL",
  ADD_ADDI: "ADD_ADDI",
  BEQ: "BEQ",
  JAL_RET: "JAL_RET",
  NEG: "NEG",
  NOR: "NOR",
};

class Program {
  constructor(code) {
    this.instructions = this.parser(code);
    this.pc = 0;
    this.clockCycle = 0;
    this.finished = false;
    this.labelToPc = {};
  }

  parser(code) {
    //parses the code and returns an array of instructions

    let instructions = [];
    var lines = code.split("\n");

    lines.forEach((_, indx, self) => {
      self[indx] = self[indx].toUpperCase();
      self[indx] = self[indx].replaceAll(",", " ");
      self[indx] = self[indx].replace(/\s\s+/g, " ");
    });
    lines = lines.filter((line) => line.length > 0);

    const labels = [];
    for (var i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineSplit = line.split(" ");
      let instruction = null;
      let instructionParams = {};

      //TODO: read inst format: lw rd, offset(rs)
      if (line.includes("LW")) {
        instructionParams = {
          type: InstructionType.LW,
          destinationRegister: lineSplit[1],
          sourceRegister1: lineSplit[2],
          immediate: lineSplit[3],
        };
      } else if (line.includes("SW")) {
        instructionParams = {
          type: InstructionType.SW,
          sourceRegister1: lineSplit[1],
          sourceRegister2: lineSplit[2],
          immediate: lineSplit[3],
        };
      } else if (line.includes("MUL")) {
        instructionParams = {
          type: InstructionType.MUL,
          destinationRegister: lineSplit[1],
          sourceRegister1: lineSplit[2],
          sourceRegister2: lineSplit[3],
        };
      } else if (line.includes("ADD")) {
        instructionParams = {
          type: InstructionType.ADD_ADDI,
          destinationRegister: lineSplit[1],
          sourceRegister1: lineSplit[2],
          sourceRegister2: lineSplit[3],
        };
      } else if (line.includes("ADDI")) {
        instructionParams = {
          type: InstructionType.ADD_ADDI,
          destinationRegister: lineSplit[1],
          sourceRegister1: lineSplit[2],
          immediate: lineSplit[3],
        };
      } else if (line.includes("BEQ")) {
        instructionParams = {
          type: InstructionType.BEQ,
          sourceRegister1: lineSplit[1],
          sourceRegister2: lineSplit[2],
          label: lineSplit[3],
        };
        labels.push(lineSplit[3]);
      } else if (line.includes("JAL")) {
        instructionParams = {
          type: InstructionType.JAL_RET,
          label: lineSplit[1],
        };
        labels.push(lineSplit[1]);
      } else if (line.includes("RETURN")) {
        instructionParams = {
          type: InstructionType.JAL_RET,
        };
      } else if (line.includes("NEG")) {
        instructionParams = {
          type: InstructionType.NEG,
          destinationRegister: lineSplit[1],
          sourceRegister1: lineSplit[2],
        };
      } else if (line.includes("NOR")) {
        instructionParams = {
          type: InstructionType.NOR,
          destinationRegister: lineSplit[1],
          sourceRegister1: lineSplit[2],
          sourceRegister2: lineSplit[3],
        };
      } else if (line.includes(":")) {
        this.labelToPc[line.split(":")[0]] = i * 4;
        continue;
      } else {
        alert("Invalid Instruction");
        exit(-1);
      }

      instruction = new Instruction({
        ...instructionParams,
        pc: i * 4,
      });
      instructions.push(instruction);
    }

    const invalidLabel = labels.find((label) => !labelToPc[label]);
    if (invalidLabel) {
      alert("Invalid Label: " + invalidLabel);
      return null;
    }

    return instructions;
  }
}
/*
    The issue stage where we check if the instruction can be issued or not accoring to the availability of the reservation stations. 
    The user can choose the number of reservation stations for each type of instruction.
    Create the reservation stations and the functional units.
    Loop over instructions and check if the instruction can be issued or not.
    */
class reservationStation {
  constructor({ issueFn, executeFn, writeFn, type }) {
    this.reset();
    this.issueFn = issueFn;
    this.executeFn = executeFn;
    this.writeFn = writeFn;
    this.type = type;
  }

  reset() {
    this.type = null;
    this.busy = false;
    this.op = null;
    this.vj = null;
    this.vk = null;
    this.qj = null;
    this.qk = null;
    this.address = null;


    this.clockCycleCounter = 0;
    this.issueFn = null;
    this.executeFn = null;
    this.writeFn = null;
  }

  issue(inst) {}
}

class Register {
  constructor() {
    this.reset();
  }
  reset() {
    this.value = null;
    this.reservationStation = null;
  }
}
//create register file
class RegisterFile {
  constructor() {
    const NUM_OF_REGS = 8;
    this.registers = {};
    for (let i = 0; i < NUM_OF_REGS; i++) {
      this.registers["R" + i] = new Register();
    }
  }
}

const RF = new RegisterFile();

const NUM_OF_STATIONS = {
  [InstructionType.LW]: 2,
  [InstructionType.SW]: 2,
  [InstructionType.MUL]: 2,
  [InstructionType.ADD_ADDI]: 2,
  [InstructionType.BEQ]: 2,
  [InstructionType.JAL_RET]: 2,
  [InstructionType.NEG]: 2,
  [InstructionType.NOR]: 2,
};

const STATIONS_CONFIGS = {
  [InstructionType.LW]: {},
  [InstructionType.SW]: {},
  [InstructionType.MUL]: {
    issueFn: (inst) => {
      this.busy = true;
      this.op = inst.type;

      if (RF.registers[inst.sourceRegister1].reservationStation == null)
        this.vj = RF.registers[inst.sourceRegister1].value;
      else this.qj = RF.registers[inst.sourceRegister1].reservationStation;
    },
  },

  [InstructionType.ADD_ADDI]: {
    issueFn: (inst) => {
      this.busy = true;
      this.op = inst.type;

      if (RF.registers[inst.sourceRegister1].reservationStation == null)
        this.vj = RF.registers[inst.sourceRegister1].value;
      else this.qj = RF.registers[inst.sourceRegister1].reservationStation;

      if (inst.type == "ADDI") {
        this.vk = inst.immediate;
      } else {
        if (RF.registers[inst.sourceRegister2].reservationStation == null)
          this.vk = RF.registers[inst.sourceRegister2].value;
        else this.qk = RF.registers[inst.sourceRegister2].reservationStation;
      }
    },

    executeFn: (rs) => {
      cyclesPerInstruction[rs.op]++;
      if (rs.op == "ADDI") {
        

    },
    writeFn: (rs) => {},
  },

  [InstructionType.BEQ]: {},
  [InstructionType.JAL_RET]: {},
};

class RSTable {
  constructor() {
    this.reset();
  }
  reset() {
    this.stations = {};
    for (const type in NUM_OF_STATIONS) {
      this.stations[type] = [];
      for (let i = 0; i < NUM_OF_STATIONS[type]; i++) {
        this.stations[type].push(
          new reservationStation({
            ...STATIONS_CONFIGS[type], //TODO: VISIT THIS LINE (SYNTAX!!)
            type: type,
          })
        );
      }
    }
  }
}
