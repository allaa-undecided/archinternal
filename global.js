const RF = new RegisterFile();
const RSTable = new ReservationStationsTable();
let clockCycle =0;
let finished=false;
let pc=0;
const MEM_SIZE=100;
const memory = new Memory(MEM_SIZE);
let labelToPC = {};
branchIssued = false;



let commonDataBus = {
    value: null,
    reservationStation: null,
    reset: function(){
        this.value = null;
        this.reservationStation = null;
    }
}