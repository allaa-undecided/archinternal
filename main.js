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

function generateTable(instructions) {
  const table = document.getElementById("table");
  table.innerHTML = "";
  table.className = "table-auto result-table text-xl";
  table.id = "table";
  const tableBody = document.createElement("tbody");
  tableBody.id = "table-body";
  table.appendChild(tableBody);
  const tableHeader = document.createElement("tr");
  tableBody.appendChild(tableHeader);
  const instructionHeader = document.createElement("th");
  instructionHeader.innerHTML = "Instruction";
  tableHeader.appendChild(instructionHeader);
  const PCHeader = document.createElement("th");
  PCHeader.innerHTML = "PC";
  tableHeader.appendChild(PCHeader);
  const issueHeader = document.createElement("th");
  issueHeader.innerHTML = "Issue";
  tableHeader.appendChild(issueHeader);
  const executeHeader = document.createElement("th");
  executeHeader.innerHTML = "Execute Start";
  tableHeader.appendChild(executeHeader);
  const executeEndHeader = document.createElement("th");
  executeEndHeader.innerHTML = "Execute End";
  tableHeader.appendChild(executeEndHeader);

  const writeHeader = document.createElement("th");
  writeHeader.innerHTML = "Writes";
  tableHeader.appendChild(writeHeader);
  instructions.forEach((instruction) => {
    const row = document.createElement("tr");
    row.className = "table-row";
    tableBody.appendChild(row);
    const instructionCell = document.createElement("td");
    instructionCell.innerHTML = instruction.op;
    row.appendChild(instructionCell);

    const PCCell = document.createElement("td");
    PCCell.innerHTML = instruction.pc;
    row.appendChild(PCCell);
    const issueCell = document.createElement("td");
    issueCell.innerHTML = instruction.issueCycle ?? "--";
    row.appendChild(issueCell);
    const executeStartCell = document.createElement("td");
    executeStartCell.innerHTML = instruction.executionStartCycle ?? "--";
    row.appendChild(executeStartCell);

    const executeEndCycle = document.createElement("td");
    executeEndCycle.innerHTML = instruction.executionEndCycle ?? "--";
    row.appendChild(executeEndCycle);

    const writeCell = document.createElement("td");
    writeCell.innerHTML = instruction.writeCycle ?? "--";
    row.appendChild(writeCell);
  });
}
function generateRegisterTable() {
  const registersTable = document.getElementById("registers-table");
  registersTable.innerHTML = "";
  registersTable.className = "table-auto";
  const registersTableBody = document.createElement("tbody");
  registersTableBody.id = "registers-table-body";
  registersTable.appendChild(registersTableBody);
  const registersTableHeader = document.createElement("tr");
  registersTableBody.appendChild(registersTableHeader);
  const registerHeader = document.createElement("th");
  registerHeader.innerHTML = "Register";
  registersTableHeader.appendChild(registerHeader);
  for (let i = 0; i < 8; i++) {
    const R = document.createElement("td");
    R.innerHTML = "R" + i;
    registersTableHeader.appendChild(R);
  }
  const registersRow = document.createElement("tr");
  registersTableBody.appendChild(registersRow);
  const registerValueHeader = document.createElement("th");
  registerValueHeader.innerHTML = "Value";
  registersRow.appendChild(registerValueHeader);

  for (let i = 0; i < 8; i++) {
    const R = document.createElement("td");
    R.innerHTML = RF.registers[`R${i}`].value;
    registersRow.appendChild(R);
  }
}
function addStats() {
  const branchMispredicition = document.getElementById("branch-misprediction");
  const mispredictionPercentage =
    branchMisprecitions > 0
      ? (branchMisprecitions / branchPredictions) * 100
      : 0;
  branchMispredicition.innerHTML = mispredictionPercentage + "%";

  const IPC = document.getElementById("ipc");
  IPC.innerHTML = Number(totalInstructions / clockCycle).toFixed(2);
  const totalCycles = document.getElementById("cycle-count");
  totalCycles.innerHTML = clockCycle;
}

function generateMemoryTable() {
  const table = document.getElementById("memory-table");
  table.innerHTML = "";
  table.className = "table-auto";
  const tableBody = document.createElement("tbody");
  tableBody.id = "memory-table-body";
  table.appendChild(tableBody);
  const tableHeader = document.createElement("tr");
  tableBody.appendChild(tableHeader);
  const addressHeader = document.createElement("th");
  addressHeader.innerHTML = "Address";
  tableHeader.appendChild(addressHeader);
  const valueHeader = document.createElement("th");
  valueHeader.innerHTML = "Value";
  tableHeader.appendChild(valueHeader);
  for (let i = 0; i < 20; i++) {
    const row = document.createElement("tr");
    row.className = "table-row";
    tableBody.appendChild(row);
    const addressCell = document.createElement("td");
    addressCell.innerHTML = i;
    row.appendChild(addressCell);
    const valueCell = document.createElement("td");
    valueCell.innerHTML = memory.read(i);
    row.appendChild(valueCell);
  }
}

function start() {
  const code = document.getElementById("code").value;
  const parser = new Parser(code);
  labelToPC = parser.labelToPC;
  totalInstructions = parser.instructions.length;
  const program = new Program(parser.instructions, parser.labelToPC);
  program.simulate();

  generateTable(program.instructions);
  generateRegisterTable();
  generateMemoryTable();
  addStats();
}

class Program {
  constructor(instructions) {
    this.init(instructions);
  }

  init(instructions) {
    this.instructions = instructions;
  }
  simulate() {
    let counter = 0;
    while (!this.propgramFinished()) {
      counter++;
      clockCycle++;
      RSTable.updateStations();
      console.log(`PC ${pc / 4} at clock cycle ${clockCycle}`);
      const instruction = this.instructions[pc / 4];
      if (instruction)
        if (RSTable.issue(instruction)) {
          pc += 4;
        }
      if (counter > 200) {
        console.log("INFINITE LOOP");
        break;
      }
    }
  }

  propgramFinished() {
    const PC = pc / 4 >= this.instructions.length;
    const IS_FINISHED = RSTable.isFinished();
    console.log("PC:", PC, IS_FINISHED);
    return PC && IS_FINISHED;
  }
}
/*
      The issue stage where we check if the instruction can be issued or not accoring to the availability of the reservation stations. 
      The user can choose the number of reservation stations for each type of instruction.
      Create the reservation stations and the functional units.
      Loop over instructions and check if the instruction can be issued or not.
      */
