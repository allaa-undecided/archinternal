class Register {
  constructor() {
    this.reset();
  }
  reset() {
    this.value = 0;
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

  shouldWriteBack(rs) {
    return (
      this.registers[rs.inst.destinationRegister].reservationStation == rs.name
      
    );
  }

  writeBack(rs) {
    this.registers[rs.inst.destinationRegister].value = rs.result;
    this.registers[rs.inst.destinationRegister].reservationStation = null;
  }

}

