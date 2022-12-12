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
    this.type = null;
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
  [InstructionType.LW]: 0,
  [InstructionType.SW]: 0,
  [InstructionType.MUL]: 0,
  [InstructionType.ADD_ADDI]: 2,
  [InstructionType.BEQ]: 0,
  [InstructionType.JAL_RET]: 0,
  [InstructionType.NEG]: 0,
  [InstructionType.NOR]: 0,
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
  [InstructionType.LW]: {},
  [InstructionType.SW]: {},
  [InstructionType.MUL]: {},

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

      RF.registers[inst.destinationRegister].reservationStation = rs.name;
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

  [InstructionType.BEQ]: {},
  [InstructionType.JAL_RET]: {},
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
        station.update();
      }
    }
    this.broadcast();
  }

  broadcast() {
    if(commonDataBus.reservationStation == null) return;
    for (const type in NUM_OF_STATIONS) {
      for (let i = 0; i < NUM_OF_STATIONS[type]; i++) {
        const station = this.stations[type][i];
        if (station.isFree()) continue;
        if (station.qj == commonDataBus.reservationStation) {
          console.log("VAL",commonDataBus.value);
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
      for (let i = 0; i < NUM_OF_STATIONS[type]; i++)
        if (!this.stations[type][i].isFree()) return false;

    return true;
  }
}
