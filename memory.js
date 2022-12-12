class Memory{
    constructor(size){
        this.memory = {};
        this.init(size);
    }

    init(size){
        for(let i=0; i<size; i++){
            this.memory[i] = 0;
        }
    }
    read(address){
        return this.memory[address];
    }
    write(address, value){
        this.memory[address] = value;
    }
}