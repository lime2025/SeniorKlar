let click = true
 
function onButton(){
    
    if (click == true){
        document.getElementById("demo").innerHTML = "Test"
        click = false
    }
    else {
        document.getElementById("demo").innerHTML = "Tryk på knappen"
        click = true
    }
   
}

function Knap(){
    document.getElementById("sigma").innerHTML = "Nøjjj en sigma knapp!!!"
}

let click1 = true

function Button(){

    if (click1 == true){
        document.getElementById("bøsse").innerHTML = "Oliver Bille Gjerlevsen er bøsse!"
        click1 = false
    }
    else {
        document.getElementById("bøsse").innerHTML = "Hvem er bøsse?"
        click1 = true
    }


}