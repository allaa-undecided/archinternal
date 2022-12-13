class reservationStation {
  constructor({ issueFn, executeFn, writeFn, type, shouldExecute, name }) {
    this.reset();
    this.issueInternal = issueFn;
    this.execute = executeFn;
    this.write = writeFn;
    this.type = type;
    this.result = null;
    this.shouldExecute = shouldExecute;
    this.name = name;
  }

  reset() {
    this.busy = false;
    this.op = null;
    this.vj = null;
    this.vk = null;
    this.qj = null;
    this.qk = null;
    this.immediate = null;
    this.address = null;
   
    this.inst = null;
    this.result = null;
    this.clockCycleCounter = 0;
  }
  isFree() {
    return !this.busy;
  }
  issue(inst) {
    this.issueInternal(this, inst);
  }

  update() {
    if (this.isFree()) return;

    if (!this.inst.executed) {
      if (this.shouldExecute(this)) this.execute(this);
    } else if (!this.inst.written) this.write(this);
  }
}

const NUM_OF_STATIONS = {
  [InstructionType.LW]: 1,
  [InstructionType.SW]: 1,
  [InstructionType.MUL]: 1,
  [InstructionType.ADD_ADDI]: 3,
  [InstructionType.BEQ]: 1,
  [InstructionType.JAL_RET]: 1,
  [InstructionType.NEG]: 1,
  [InstructionType.NOR]: 1,
};
const executionCycle = {
  [InstructionType.LW]: 4,
  [InstructionType.SW]: 3,
  [InstructionType.MUL]: 8,
  [InstructionType.ADD_ADDI]: 2,
  [InstructionType.BEQ]: 1,
  [InstructionType.JAL_RET]: 1,
  [InstructionType.NEG]: 1,
  [InstructionType.NOR]: 1,
};

const STATIONS_CONFIGS = {
  [InstructionType.LW]: {
    type: InstructionType.LW,
    issueFn: (rs, inst) => {
      rs.busy = true;
      rs.inst = inst;
      rs.op = inst.type;
      if (rs.inst.issueCycle == null) {
        rs.inst.issueCycle = clockCycle;
      }

      rs.address = inst.immediate + RF.registers[inst.sourceRegister1].value;

      if (RF.registers[inst.destinationRegister].reservationStation == null) {
        rs.vj = RF.registers[inst.destinationRegister].value;
      } else rs.qj = RF.registers[inst.destinationRegister].reservationStation;

      RF.registers[rs.inst.destinationRegister].reservationStation = rs.name;
    },
    shouldExecute: (rs) => {
      return rs.qj == null;
    },
    executeFn: (rs) => {
      if (rs.inst.executionStartCycle == null)
        rs.inst.executionStartCycle = clockCycle;
      console.log(rs.name, rs.clockCycleCounter, rs.type);
      if (rs.clockCycleCounter === executionCycle[rs.type]) {
        rs.inst.executed = true;
        rs.inst.executionEndCycle = clockCycle;
        console.log(rs.name, rs.address);
        rs.result = memory.read(rs.address / 4);
      } else {
        rs.clockCycleCounter++;
      }
    },
    writeFn: (rs) => {
      if (RF.shouldWriteBack(rs)) RF.writeBack(rs);

      rs.inst.written = true;
      rs.inst.writeCycle = clockCycle;
      rs.reset();
    },
  },
  [InstructionType.SW]: {
    type: InstructionType.SW,
    issueFn: (rs, inst) => {
      rs.busy = true;
      rs.inst = inst;
      rs.op = inst.type;
      if (rs.inst.issueCycle == null) {
        rs.inst.issueCycle = clockCycle;
      }

      if (RF.registers[inst.sourceRegister1].reservationStation == null) {
        rs.vj = RF.registers[inst.sourceRegister1].value;
      } else rs.qj = RF.registers[inst.sourceRegister1].reservationStation;

      if (RF.registers[inst.sourceRegister2].reservationStation == null) {
        rs.vk = RF.registers[inst.sourceRegister2].value;
      } else rs.qk = RF.registers[inst.sourceRegister2].reservationStation;

      rs.immediate = inst.immediate;
    },

    shouldExecute: (rs) => {
      const result = rs.qj == null && rs.qk == null;

      if (result) rs.address = rs.vk + rs.immediate;
      return result;
    },
    executeFn: (rs) => {
      if (rs.inst.executionStartCycle == null)
        rs.inst.executionStartCycle = clockCycle;
      console.log(rs.name, rs.clockCycleCounter, rs.type);
      if (rs.clockCycleCounter === executionCycle[rs.type]) {
        rs.inst.executed = true;
        rs.inst.executionEndCycle = clockCycle;
        console.log(rs.name, rs.address);
        memory.write(rs.address / 4, rs.vj);
      } else {
        rs.clockCycleCounter++;
      }
    },
    writeFn: (rs) => {
      rs.inst.written = true;
      rs.inst.writeCycle = clockCycle;
      rs.reset();
    },
  },
  [InstructionType.MUL]: {
    type: InstructionType.MUL,
    issueFn: (rs, inst) => {
      console.log("MUL");
      rs.busy = true;
      rs.inst = inst;
      rs.op = inst.type;
      if (rs.inst.issueCycle == null) {
        rs.inst.issueCycle = clockCycle;
      }

      if (RF.registers[inst.sourceRegister1].reservationStation == null)
        rs.vj = RF.registers[inst.sourceRegister1].value;
      else rs.qj = RF.registers[inst.sourceRegister1].reservationStation;

      if (RF.registers[inst.sourceRegister2].reservationStation == null)
        rs.vk = RF.registers[inst.sourceRegister2].value;
      else rs.qk = RF.registers[inst.sourceRegister2].reservationStation;

      RF.registers[inst.destinationRegister].reservationStation = rs.name;
    },
    shouldExecute: (rs) => {
      let result;
      result = rs.qj == null && rs.qk == null;
      if (rs.qj == null && rs.qk == null) {
        console.log("Finished previous cycle");
      }
      return result;
    },
    executeFn: (rs) => {
      if (rs.inst.executionStartCycle == null) {
        rs.inst.executionStartCycle = clockCycle;
      }
      rs.clockCycleCounter++;
      if (rs.clockCycleCounter < executionCycle[rs.inst.op]) return;

      if (rs.inst.executionEndCycle == null) {
        rs.inst.executionEndCycle = clockCycle;
        rs.result = rs.vj * rs.vk;
        console.log("MUL result: ", rs.result);
      }
      if (commonDataBus.reservationStation == null) {
        rs.inst.executed = true;
        commonDataBus.value = rs.result;
        commonDataBus.reservationStation = rs.name;
      }
    },
    writeFn: (rs) => {
      console.log("MUL write 1");
      if (rs.inst.writeCycle == null) rs.inst.writeCycle = clockCycle;

      if (
        RF.registers[rs.inst.destinationRegister].reservationStation == rs.name
      ) {
        console.log("MUL write");
        RF.registers[rs.inst.destinationRegister].value = rs.result;
        RF.registers[rs.inst.destinationRegister].reservationStation = null;
      }
      rs.inst.written = true;
      rs.reset();
    },
  },

  [InstructionType.ADD_ADDI]: {
    type: InstructionType.ADD_ADDI,

    issueFn: (rs, inst) => {
      rs.busy = true;
      rs.inst = inst;
      rs.op = inst.type;
      if (rs.inst.issueCycle == null) {
        rs.inst.issueCycle = clockCycle;
      }

      if (RF.registers[inst.sourceRegister1].reservationStation == null)
        rs.vj = RF.registers[inst.sourceRegister1].value;
      else rs.qj = RF.registers[inst.sourceRegister1].reservationStation;

      if (rs.inst.opCode == OP_CODES.ADDI) {
        rs.immediate = inst.immediate;
      } else {
        if (RF.registers[inst.sourceRegister2].reservationStation == null)
          rs.vk = RF.registers[inst.sourceRegister2].value;
        else rs.qk = RF.registers[inst.sourceRegister2].reservationStation;
      }

      RF.registers[rs.inst.destinationRegister].reservationStation = rs.name;
    },
    shouldExecute: (rs) => {
      let result;

      if (rs.inst.opCode == OP_CODES.ADDI) {
        result = rs.qj == null;
      } else if (rs.inst.opCode == OP_CODES.ADD) {
        result = rs.qj == null && rs.qk == null;
      }
      return result;
    },

    executeFn: (rs) => {
      if (rs.inst.executionStartCycle == null) {
        rs.inst.executionStartCycle = clockCycle;
      }
      rs.clockCycleCounter++;
      if (rs.clockCycleCounter < executionCycle[rs.inst.op]) return;

      if (rs.inst.executionEndCycle == null) {
        rs.inst.executionEndCycle = clockCycle;
        if (rs.inst.opCode == OP_CODES.ADDI) {
          rs.result = rs.vj + rs.immediate;
        } else if (rs.inst.opCode == OP_CODES.ADD) {
          rs.result = rs.vj + rs.vk;
        }
      }

      if (commonDataBus.reservationStation == null) {
        rs.inst.executed = true;
        commonDataBus.value = rs.result;
        commonDataBus.reservationStation = rs.name;
      }
    },
    writeFn: (rs) => {
      if (rs.inst.writeCycle == null) rs.inst.writeCycle = clockCycle;

      if (RF.shouldWriteBack(rs)) RF.writeBack(rs);

      rs.inst.written = true;
      rs.reset();
    },
  },

  [InstructionType.BEQ]: {
    type: InstructionType.BEQ,

    issueFn: (rs, inst) => {
      rs.busy = true;
      rs.inst = inst;
      rs.op = inst.type;
      branchIssued = true;
      branchPC = inst.pc;
      if (rs.inst.issueCycle == null) {
        rs.inst.issueCycle = clockCycle;
      }

      if (RF.registers[inst.sourceRegister1].reservationStation == null)
        rs.vj = RF.registers[inst.sourceRegister1].value;
      else rs.qj = RF.registers[inst.sourceRegister1].reservationStation;

      if (RF.registers[inst.sourceRegister2].reservationStation == null)
        rs.vk = RF.registers[inst.sourceRegister2].value;
      else rs.qk = RF.registers[inst.sourceRegister2].reservationStation;

      rs.address = labelToPC[inst.label];
    },
    shouldExecute: (rs) => {
      return rs.qj == null && rs.qk == null;
    },

    executeFn: (rs) => {
      if (rs.inst.executionStartCycle == null) {
        rs.inst.executionStartCycle = clockCycle;
      }
      rs.clockCycleCounter++;
      if (rs.clockCycleCounter <= executionCycle[rs.inst.op]) return;

      if (rs.inst.executionEndCycle == null) {
        rs.inst.executionEndCycle = clockCycle;
        rs.result = rs.vj - rs.vk;
        if (rs.result == 0) {
          pc = rs.address;
          RSTable.flushForBranch();
        }

        branchIssued = false;
        branchPC = null;
      }
    },
  },
  [InstructionType.JAL_RET]: {
    type: InstructionType.JAL_RET,

    issueFn: (rs, inst) => {
      rs.busy = true;
      rs.inst = inst;
      rs.op = inst.type;
      if (rs.inst.issueCycle == null) {
        rs.inst.issueCycle = clockCycle;
      }

      if (rs.inst.opCode == OP_CODES.JAL) {
        rs.address = labelToPC[inst.label];
        inst.destinationRegister = "R1";
      } else if (rs.inst.opCode == OP_CODES.RET) {
        rs.vj = RF.registers["R1"].value;
      }

      if (rs.inst.opCode == OP_CODES.JAL)
        RF.registers["R1"].reservationStation = rs.name;
    },
    shouldExecute: (rs) => {
      let result;
      result = rs.qj == null;

      return result;
    },

    executeFn: (rs) => {
      if (rs.inst.executionStartCycle == null) {
        rs.inst.executionStartCycle = clockCycle;
      }
      rs.clockCycleCounter++;
      if (rs.clockCycleCounter <= executionCycle[rs.inst.op]) return;

      if (rs.inst.executionEndCycle == null) {
        rs.inst.executionEndCycle = clockCycle;

        if (rs.inst.opCode == OP_CODES.JAL) {
          rs.result = rs.inst.pc + 4;
          pc = rs.address;
        } else if (rs.inst.opCode == OP_CODES.RET) {
          pc = rs.vj;
        }
      }

      if (rs.inst.opCode == OP_CODES.JAL) {
        if (commonDataBus.reservationStation == null) {
          rs.inst.executed = true;
          commonDataBus.value = rs.result;
          commonDataBus.reservationStation = rs.name;
        }
      } else {
        rs.inst.executed = true;
      }
    },
    writeFn: (rs) => {
      if (rs.inst.writeCycle == null) rs.inst.writeCycle = clockCycle;
      if (rs.inst.opCode == OP_CODES.JAL) {
        if (RF.shouldWriteBack(rs)) RF.writeBack(rs);
      }
      rs.inst.written = true;
      rs.reset();
    },
  },
  [InstructionType.NOR]: {
    type: InstructionType.NOR,
    issueFn: (rs, inst) => {
      rs.busy = true;
      rs.inst = inst;
      rs.op = inst.type;
      if (rs.inst.issueCycle == null) {
        rs.inst.issueCycle = clockCycle;
      }

      if (RF.registers[inst.sourceRegister1].reservationStation == null)
        rs.vj = RF.registers[inst.sourceRegister1].value;
      else rs.qj = RF.registers[inst.sourceRegister1].reservationStation;

      if (RF.registers[inst.sourceRegister2].reservationStation == null)
        rs.vk = RF.registers[inst.sourceRegister2].value;
      else rs.qk = RF.registers[inst.sourceRegister2].reservationStation;

      RF.registers[inst.destinationRegister].reservationStation = rs.name;
    },
    shouldExecute: (rs) => {
      let result;
      result = rs.qj == null && rs.qk == null;
      return result;
    },
    executeFn: (rs) => {
      if (rs.inst.executionStartCycle == null) {
        rs.inst.executionStartCycle = clockCycle;
      }
      rs.clockCycleCounter++;
      if (rs.clockCycleCounter < executionCycle[rs.inst.op]) return;

      if (rs.inst.executionEndCycle == null) {
        rs.inst.executionEndCycle = clockCycle;
        rs.result = ~(rs.vj | rs.vk);
      }
      if (commonDataBus.reservationStation == null) {
        rs.inst.executed = true;
        commonDataBus.value = rs.result;
        commonDataBus.reservationStation = rs.name;
      }
    },
    writeFn: (rs) => {
      if (rs.inst.writeCycle == null) rs.inst.writeCycle = clockCycle;

      if (
        RF.registers[rs.inst.destinationRegister].reservationStation == rs.name
      ) {
        RF.registers[rs.inst.destinationRegister].value = rs.result;
        RF.registers[rs.inst.destinationRegister].reservationStation = null;
      }
      rs.inst.written = true;
      rs.reset();
    },
  },
  [InstructionType.NEG]: {
    type: InstructionType.NEG,
    issueFn: (rs, inst) => {
      rs.busy = true;
      rs.inst = inst;
      rs.op = inst.type;
      if (rs.inst.issueCycle == null) {
        rs.inst.issueCycle = clockCycle;
      }

      if (RF.registers[inst.sourceRegister1].reservationStation == null)
        rs.vj = RF.registers[inst.sourceRegister1].value;
      else rs.qj = RF.registers[inst.sourceRegister1].reservationStation;

      RF.registers[inst.destinationRegister].reservationStation = rs.name;
    },
    shouldExecute: (rs) => {
      let result;
      result = rs.qj == null;
      return result;
    },
    executeFn: (rs) => {
      if (rs.inst.executionStartCycle == null) {
        rs.inst.executionStartCycle = clockCycle;
      }
      rs.clockCycleCounter++;
      if (rs.clockCycleCounter <= executionCycle[rs.inst.op]) {
        return;
      }

      if (rs.inst.executionEndCycle == null) {
        rs.inst.executionEndCycle = clockCycle;
        rs.result = rs.vj * -1;
      }
      if (commonDataBus.reservationStation == null) {
        rs.inst.executed = true;
        commonDataBus.value = rs.result;
        commonDataBus.reservationStation = rs.name;
      }
    },
    writeFn: (rs) => {
      if (rs.inst.writeCycle == null) rs.inst.writeCycle = clockCycle;

      if (
        RF.registers[rs.inst.destinationRegister].reservationStation == rs.name
      ) {
        RF.registers[rs.inst.destinationRegister].value = rs.result;
        RF.registers[rs.inst.destinationRegister].reservationStation = null;
      }
      rs.inst.written = true;
      rs.reset();
    },
  },
};

class ReservationStationsTable {
  constructor() {
    this.stations = {};
    for (const type in NUM_OF_STATIONS) {
      this.stations[type] = [];
      for (let i = 0; i < NUM_OF_STATIONS[type]; i++) {
        this.stations[type].push(
          new reservationStation({
            name: `${type} ${i}`,
            ...STATIONS_CONFIGS[type],
          })
        );
      }
    }
  }

  reset() {
    for (const type in NUM_OF_STATIONS) {
      for (let i = 0; i < NUM_OF_STATIONS[type]; i++) {
        this.stations[type][i].reset();
      }
    }
  }

  getFreeStation(type) {
    return this.stations[type].find((station) => station.isFree());
  }

  issue(inst) {
    const station = this.getFreeStation(inst.op);
    if (station == null) return false;
    station.issue(inst);
    return true;
  }

  updateStations() {
    for (const type in NUM_OF_STATIONS) {
      for (let i = 0; i < NUM_OF_STATIONS[type]; i++) {
        const station = this.stations[type][i];
        if (station.isFree()) continue;

        if (branchIssued) {
          if (type == InstructionType.BEQ || station.inst.pc < branchPC)
            station.update();
        } else station.update();
      }
    }
    this.broadcast();
  }

  broadcast() {
    if (commonDataBus.reservationStation == null) return;
    for (const type in NUM_OF_STATIONS) {
      for (let i = 0; i < NUM_OF_STATIONS[type]; i++) {
        const station = this.stations[type][i];
        if (station.isFree()) continue;
        if (station.qj == commonDataBus.reservationStation) {
          station.vj = commonDataBus.value;
          station.qj = null;
        }
        if (station.qk == commonDataBus.reservationStation) {
          station.vk = commonDataBus.value;
          station.qk = null;
        }
      }
    }
    commonDataBus.reset();
  }

  isFinished() {
    for (const type in NUM_OF_STATIONS)
      for (let i = 0; i < NUM_OF_STATIONS[type]; i++) {
        const result = !this.stations[type][i].isFree();
        if (result) {
          console.log(this.stations[type][i].name);
          return false;
        }
      }

    return true;
  }

  flushForBranch() {
    for (const type in NUM_OF_STATIONS) {
      for (let i = 0; i < NUM_OF_STATIONS[type]; i++) {
        const station = this.stations[type][i];
        if (station.isFree()) continue;
        if (station.inst.pc > branchPC) {
          station.inst?.resetCycles();
          station.reset();
        }
      }
    }
  }
}
