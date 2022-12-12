class reservationStation {
  constructor({ issueFn, executeFn, writeFn, type, shouldExecute }) {
    this.reset();
    this.issueInternal = issueFn;
    this.execute = executeFn;
    this.write = writeFn;
    this.type = type;
    this.result = null;
    this.shouldExecute = shouldExecute;
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
    console.log(this.busy);
    if (this.isFree()) return;

    if (!this.inst.executed && this.shouldExecute(this)) this.execute(this);
    else if (!this.inst.written) this.write(this);
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

      rs.inst.executionEndCycle = clockCycle;
      if (rs.inst.opCode == OP_CODES.ADDI) {
        rs.result = rs.vj + rs.immediate;
      } else if (rs.inst.opCode == OP_CODES.ADD) {
        rs.result = rs.vj + rs.vk;
      }
      rs.inst.executed = true;
      commonDataBus = { value: rs.result, reservationStation: this };
    },
    writeFn: (rs) => {
      if (rs.inst.writeCycle == null) {
        rs.inst.writeCycle = clockCycle;
      }
      if (RF.registers[rs.inst.destinationRegister].reservationStation == this) {
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
          new reservationStation(STATIONS_CONFIGS[type])
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
  }

  broadcast() {
    for (const type in NUM_OF_STATIONS) {
      for (let i = 0; i < NUM_OF_STATIONS[type]; i++) {
        const station = this.stations[type][i];
        if (station.isFree()) continue;
        if (station.qj == commonDataBus.reservationStation)
          station.vj = commonDataBus.value;
        if (station.qk == commonDataBus.reservationStation)
          station.vk = commonDataBus.value;
      }
    }
    commonDataBus.reset();
  }
}
