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
}

