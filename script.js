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