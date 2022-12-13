const RF = new RegisterFile();
const RSTable = new ReservationStationsTable();
let clockCycle =0;
let finished=false;
let pc=0;
const MEM_SIZE=100;
const memory = new Memory(MEM_SIZE);
let labelToPC = {};
let branchIssued = false;
let branchPC = null;
let branchMisprecitions=0;
let branchPredictions=0;
let totalInstructions=0;



let commonDataBus = {
    value: null,
    reservationStation: null,
    reset: function(){
        this.value = null;
        this.reservationStation = null;
    }
}
