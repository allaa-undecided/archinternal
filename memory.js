class Memory{
    constructor(size){
        this.memory = {};
        this.init(size);
    }

    init(size){
        for(let i=0; i<size; i++){
            this.memory[i] = 0;
        }
        this.memory[0]=20
        this.memory[1]=30
        this.memory[2]=40
        this.memory[3]=50
    }
    read(address){
        return this.memory[address];
    }
    write(address, value){
        this.memory[address] = value;
    }
}