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
      self[indx] = self[indx].trim();
    });
    lines = lines.filter((line) => line.length > 0);
    console.log(lines);

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

        // if (!lineSplit[3].includes("(")) {
        //   instructionParams.immediate = lineSplit[3].split("(")[0];
        //   instructionParams.sourceRegister1 = lineSplit[3]
        //     .split("(")[1]
        //     .replace(")", "");
        // }

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
      } else if (line.includes("RET")) {
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
    const invalidLabel = labels.find((label) => !this.labelToPC[label]);
    if (invalidLabel) {
      alert("Invalid Label: " + invalidLabel);
      return [];
    }

    this.instructions = instructions;
  }
}
