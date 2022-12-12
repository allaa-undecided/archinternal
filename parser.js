class Parser {
  constructor(code) {
    this.instructions = [];
    this.labelToPC = {};
    this.parse(code);
  }

  parse(code) {
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
          type: lineSplit[0],
          destinationRegister: lineSplit[1],
          sourceRegister1: lineSplit[2],
          immediate: lineSplit[3],
        };
      } else if (line.includes("SW")) {
        instructionParams = {
          type: lineSplit[0],
          sourceRegister1: lineSplit[1],
          sourceRegister2: lineSplit[2],
          immediate: lineSplit[3],
        };
      } else if (line.includes("MUL")) {
        instructionParams = {
          type: lineSplit[0],
          destinationRegister: lineSplit[1],
          sourceRegister1: lineSplit[2],
          sourceRegister2: lineSplit[3],
        };
      } else if (line.includes("ADDI")) {
        instructionParams = {
          type: lineSplit[0],
          destinationRegister: lineSplit[1],
          sourceRegister1: lineSplit[2],
          immediate: lineSplit[3],

        };
      } else if (line.includes("ADD")) {
        instructionParams = {
          type: lineSplit[0],
          destinationRegister: lineSplit[1],
          sourceRegister1: lineSplit[2],
          sourceRegister2: lineSplit[3],

        };
      } else if (line.includes("BEQ")) {
        instructionParams = {
          type: lineSplit[0],
          sourceRegister1: lineSplit[1],
          sourceRegister2: lineSplit[2],
          label: lineSplit[3],
        };
        labels.push(lineSplit[3]);
      } else if (line.includes("JAL")) {
        instructionParams = {
          type: lineSplit[0],
          label: lineSplit[1],
        };
        labels.push(lineSplit[1]);
      } else if (line.includes("RETURN")) {
        instructionParams = {
          type: lineSplit[0],
        };
      } else if (line.includes("NEG")) {
        instructionParams = {
          type: lineSplit[0],
          destinationRegister: lineSplit[1],
          sourceRegister1: lineSplit[2],
        };
      } else if (line.includes("NOR")) {
        instructionParams = {
          type: lineSplit[0],
          destinationRegister: lineSplit[1],
          sourceRegister1: lineSplit[2],
          sourceRegister2: lineSplit[3],
        };
      } else if (line.includes(":")) {
        this.labelToPC[line.split(":")[0]] = i * 4;
        continue;
      } else {
        alert("Invalid Instruction");
        return [];
      }

      instruction = new Instruction({
        ...instructionParams,
        pc: i * 4,
      });
      instructions.push(instruction);
    }
console.log(labels)
    const invalidLabel = labels.find((label) => !this.labelToPC[label]);
    if (invalidLabel) {
      alert("Invalid Label: " + invalidLabel);
      return [];
    }

    this.instructions = instructions;
  }
}
