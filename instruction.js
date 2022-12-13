const OP_CODES = {
  ADD: 0,
  ADDI: 1,
  JAL: 0,
  RET: 1,
};

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
    this.opCode = null; //to differentiate add/addi and jal/ret

    this.op = InstructionType[type];
    if (this.op === InstructionType.ADD_ADDI) {
      this.opCode = OP_CODES[type];
    } else if (this.op === InstructionType.JAL_RET) {
      this.opCode = OP_CODES[type];
    }

    this.destinationRegister = destinationRegister;
    this.sourceRegister1 = sourceRegister1;
    this.sourceRegister2 = sourceRegister2;
    this.immediate = Number(immediate);
    this.pc = pc;
    this.label = label;

    this.issueCycle = null;
    this.executionStartCycle = null;
    this.executionEndCycle = null;
    this.writeCycle = null;

    //may be used in the future
    this.reservationStation = null;
    this.executed = false;
    this.written = false;
  }

  resetCycles() {
    this.issueCycle = null;
    this.executionEndCycle = null;
    this.executionStartCycle = null;
    this.writeCycle = null;
  }
}

const InstructionType = {
  LW: "LW",
  SW: "SW",
  MUL: "MUL",
  ADD: "ADD_ADDI",
  ADDI: "ADD_ADDI",
  ADD_ADDI: "ADD_ADDI",
  BEQ: "BEQ",
  JAL: "JAL_RET",
  RET: "JAL_RET",
  JAL_RET: "JAL_RET",
  NEG: "NEG",
  NOR: "NOR",
};
