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
};


const InstructionType = {
    LW: "LW",
    SW: "SW",
    MUL: "MUL",
    ADD: "ADD",
    ADDI: "ADDI",
    BEQ: "BEQ",
    JAL: "JAL",
    RETURN: "RETURN",
    NEG: "NEG",
    NOR: "NOR",
  };

  const labelToPc = {};


function parser(code) {
  //parses the code and returns an array of instructions

  let instructions = [];
  var lines = code.split("\n");

  lines.forEach((_, indx, self) => {
    self[indx] = self[indx].toUpperCase();
    self[indx] = self[indx].replaceAll(",", " ");
    self[indx] = self[indx].replace(/\s\s+/g, " ");
  });
  lines = lines.filter((line) => line.length > 0);


const labels=[];
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
        type: InstructionType.ADD,
        destinationRegister: lineSplit[1],
        sourceRegister1: lineSplit[2],
        sourceRegister2: lineSplit[3],
      };
    } else if (line.includes("ADDI")) {
      instructionParams = {
        type: InstructionType.ADDI,
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
        type: InstructionType.JAL,
        label: lineSplit[1],
      };
        labels.push(lineSplit[1]);
    } else if (line.includes("RETURN")) {
      instructionParams = {
        type: InstructionType.RETURN,
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
        labelToPc[line.split(":")[0]] = i * 4;
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
  
  const invalidLabel=labels.find((label)=>!labelToPc[label]);
    if(invalidLabel){
        alert("Invalid Label: "+invalidLabel);
        return null;
    }

  return instructions;
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


function main() {
  var program = new Program();
  program.load("program.txt");
  program.run();
}

class Program {
  constructor() {
    this.instructions = [];
    this.registers = new Registers();
    this.memory = new Memory();
    this.reservationStations = new ReservationStations();
    this.functionalUnits = new FunctionalUnits();
    this.clock = 0;
    this.pc = 0;
    this.finished = false;
    this.branchPrediction = true;
    this.branchPredictionTable = new BranchPredictionTable();
    this.branchPredictionTable.add(0, 0);
    this.branchPredictionTable.add(1, 1);
    this.branchPredictionTable.add(2, 2);
    this.branchPredictionTable.add(3, 3);
    this.branchPredictionTable.add(4, 4);
    this.branchPredictionTable.add(5, 5);
  }

  load(fileName) {
    var fs = require("fs");
    var lines = fs.readFileSync(fileName, "utf8").split(" ");
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var instruction = new Instruction(line);
      this.instructions.push(instruction);
    }
  }

  run() {
    while (!this.finished) {
      this.clock++;
      this.fetch();
      this.issue();
      this.execute();
      this.write();
      this.print();
    }
  }

  fetch() {
    var instruction = this.instructions[this.pc];
    if (instruction) {
      this.pc++;
    }
  }

  issue() {
    var instruction = this.instructions[this.pc - 1];
    if (instruction) {
      if (instruction.type == InstructionType.LW) {
        this.reservationStations.add(instruction);
      } else if (instruction.type == InstructionType.SW) {
        this.reservationStations.add(instruction);
      } else if (instruction.type == InstructionType.MUL) {
        this.reservationStations.add(instruction);
      } else if (instruction.type == InstructionType.ADD) {
        this.reservationStations.add(instruction);
      } else if (instruction.type == InstructionType.ADDI) {
        this.reservationStations.add(instruction);
      } else if (instruction.type == InstructionType.BEQ) {
        this.reservationStations.add(instruction);
      } else if (instruction.type == InstructionType.JAL) {
        this.reservationStations.add(instruction);
      } else if (instruction.type == InstructionType.RETURN) {
        this.reservationStations.add(instruction);
      }
    }
  }

  execute() {
    var reservationStation = this.reservationStations.get();
    if (reservationStation) {
      if (reservationStation.instruction.type == InstructionType.LW) {
        this.functionalUnits.load(reservationStation);
      } else if (reservationStation.instruction.type == InstructionType.SW) {
        this.functionalUnits.store(reservationStation);
      } else if (reservationStation.instruction.type == InstructionType.MUL) {
        this.functionalUnits.multiply(reservationStation);
      } else if (reservationStation.instruction.type == InstructionType.ADD) {
        this.functionalUnits.add(reservationStation);
      } else if (reservationStation.instruction.type == InstructionType.ADDI) {
        this.functionalUnits.addImmediate(reservationStation);
      } else if (reservationStation.instruction.type == InstructionType.BEQ) {
        this.functionalUnits.branch(reservationStation);
      } else if (reservationStation.instruction.type == InstructionType.JAL) {
        this.functionalUnits.jumpAndLink(reservationStation);
      } else if (
        reservationStation.instruction.type == InstructionType.RETURN
      ) {
        this.functionalUnits.return(reservationStation);
      }
    }
  }

  write() {
    var reservationStation = this.reservationStations.get();
    if (reservationStation) {
      if (reservationStation.instruction.type == InstructionType.LW) {
        this.registers.set(
          reservationStation.instruction.destinationRegister,
          reservationStation.value
        );
      } else if (reservationStation.instruction.type == InstructionType.SW) {
        this.memory.set(
          reservationStation.instruction.sourceRegister1,
          reservationStation.value
        );
      } else if (reservationStation.instruction.type == InstructionType.MUL) {
        this.registers.set(
          reservationStation.instruction.destinationRegister,
          reservationStation.value
        );
      } else if (reservationStation.instruction.type == InstructionType.ADD) {
        this.registers.set(
          reservationStation.instruction.destinationRegister,
          reservationStation.value
        );
      } else if (reservationStation.instruction.type == InstructionType.ADDI) {
        this.registers.set(
          reservationStation.instruction.destinationRegister,
          reservationStation.value
        );
      } else if (reservationStation.instruction.type == InstructionType.BEQ) {
        this.branchPrediction = reservationStation.value;
      } else if (reservationStation.instruction.type == InstructionType.JAL) {
        this.pc = reservationStation.value;
      } else if (
        reservationStation.instruction.type == InstructionType.RETURN
      ) {
        this.pc = reservationStation.value;
      }
    }
  }

  print() {
    console.log("Clock: " + this.clock);
    console.log("PC: " + this.pc);
    console.log("Branch Prediction: " + this.branchPrediction);
    this.registers.print();
    this.memory.print();
    this.reservationStations.print();
    this.functionalUnits.print();
    console.log(" ");
  }
}

/**
 * register has two states: busy and available
 * if busy, it has a reservation station number
 * if available, it has a value
 *
 * when a reservation station is added, it checks if the registers are available
 *
 * when a reservation station is removed, it checks if the registers are busy
 *
 * let the user choose the number of reservation stations and functional units
 *
 * create a parser for the instructions
 */

class BranchPredictionTable {
  constructor() {
    this.table = [];
  }

  add(key, value) {
    this.table[key] = value;
  }

  get(key) {
    return this.table[key];
  }
}

class FunctionalUnits {
  constructor() {
    this.units = [];
  }

  add(unit) {
    this.units.push(unit);
  }

  load(reservationStation) {
    var unit = this.getAvailableUnit();
    if (unit) {
      unit.load(reservationStation);
    }
  }

  store(reservationStation) {
    var unit = this.getAvailableUnit();
    if (unit) {
      unit.store(reservationStation);
    }
  }

  multiply(reservationStation) {
    var unit = this.getAvailableUnit();
    if (unit) {
      unit.multiply(reservationStation);
    }
  }

  add(reservationStation) {
    var unit = this.getAvailableUnit();
    if (unit) {
      unit.add(reservationStation);
    }
  }

  addImmediate(reservationStation) {
    var unit = this.getAvailableUnit();
    if (unit) {
      unit.addImmediate(reservationStation);
    }
  }

  branch(reservationStation) {
    var unit = this.getAvailableUnit();
    if (unit) {
      unit.branch(reservationStation);
    }
  }

  jumpAndLink(reservationStation) {
    var unit = this.getAvailableUnit();
    if (unit) {
      unit.jumpAndLink(reservationStation);
    }
  }

  return(reservationStation) {
    var unit = this.getAvailableUnit();
    if (unit) {
      unit.return(reservationStation);
    }
  }

  getAvailableUnit() {
    for (var i = 0; i < this.units.length; i++) {
      var unit = this.units[i];
      if (unit.available) {
        return unit;
      }
    }
  }

  print() {
    console.log("Functional Units:");
    for (var i = 0; i < this.units.length; i++) {
      var unit = this.units[i];
      unit.print();
    }
  }
}

class FunctionalUnit {
  constructor() {
    this.available = true;
    this.reservationStation = null;
  }

  load(reservationStation) {
    this.available = false;
    this.reservationStation = reservationStation;
  }

  store(reservationStation) {
    this.available = false;
    this.reservationStation = reservationStation;
  }

  multiply(reservationStation) {
    this.available = false;
    this.reservationStation = reservationStation;
  }

  add(reservationStation) {
    this.available = false;
    this.reservationStation = reservationStation;
  }

  addImmediate(reservationStation) {
    this.available = false;
    this.reservationStation = reservationStation;
  }

  branch(reservationStation) {
    this.available = false;
    this.reservationStation = reservationStation;
  }

  jumpAndLink(reservationStation) {
    this.available = false;
    this.reservationStation = reservationStation;
  }

  return(reservationStation) {
    this.available = false;
    this.reservationStation = reservationStation;
  }

  print() {
    console.log("Available: " + this.available);
    if (this.reservationStation) {
      console.log("Reservation Station: " + this.reservationStation.number);
    }
  }
}
