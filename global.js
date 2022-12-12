const RF = new RegisterFile();
const RSTable = new ReservationStationsTable();
let clockCycle =0;
let finished=false;

let commonDataBus = {
    value: null,
    reservationStation: null,
    reset: function(){
        this.value = null;
        this.reservationStation = null;
    }
}