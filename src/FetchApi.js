import React,{useState} from 'react';

// Initial setup - will run once
var bGettingActors = false;
var bGameStarted = false;
const allActors = new Array(200);
allActors.fill(0);
var allActorsFromDB = new Array();
var allFilmsFromDB = new Array();
var currentFilms = new Array(10);
var filmEdgeGraph = new Array(1000);
var apiCalls = 0;
var totalInfected=0;
// set all actors and films - TODO: update URL based on environment variables
fetch('../home/allFilms')
.then((response) => response.json())
.then((json) => {
    for (let i = 0; i < json.length; i++){
        allFilmsFromDB.push(json[i].title);
    }
});
fetch('../home/allActors')
.then((response) => response.json())
.then((json) => {
    for (let i = 0; i < json.length; i++){
        allActorsFromDB.push(json[i].firstname +" "+ json[i].lastname);
    }
});
apiCalls += 2;

// Main function where website is held.
function FetchAPI(){
    const [data, setData] = useState([]);
    const [zombieActors, setZombieActors] = useState([]);
    const [healthyActors, setHealthyActors] = useState([]);
    const [infectedActors, setinfectedActors] = useState([]);
    const [deadActors, setDeadActors] = useState([]);

    const apiGetAllFilms = () => {
        bGettingActors = false;
        let formEntry = document.getElementById("FilmIDEntry").value;
        if (!Number.isInteger(Number(formEntry))) return;
        if (formEntry < 0) return;
        fetch('../home/getFilmsFromActor/'+formEntry)
        .then((response) => response.json())
        .then((json) => {
            setData(json);
        });
        apiCalls++;
    }

    const apiGetActorsFromFilm = () => {
        bGettingActors = true;
        let formEntry = document.getElementById("FilmIDEntry").value;
        if (!Number.isInteger(Number(formEntry))) return;
        if (formEntry <= 0) return;
        fetch('../home/getActorsFromFilm/' + formEntry)
        .then((response) => response.json())
        .then((json) => {
            setData(json);
        });
        apiCalls++;
    }
    
    let zombieList;
    let infectedList;
    let healthyList;
    let deadList;
    let responseList;
    if (bGettingActors){
        responseList = data.map((item) => (<li key={item.actorid}>{item.firstname} {item.lastname}</li>));
    } else {
        responseList = data.map((item) => (<li key={item.filmid}>film {item.filmid} is {item.title} and is {item.duration} minutes long.</li>))
    }
    healthyList = healthyActors.map((item) => (<li className="healthy" key={item}>{allActorsFromDB[item]}</li>));
    infectedList = infectedActors.map((item) => (<li className="infected" key={item}>{allActorsFromDB[item]}</li>));
    zombieList = zombieActors.map((item) => (<li className="zombie" key={item}>{allActorsFromDB[item]}</li>));
    deadList = deadActors.map((item) => (<li className="dead" key={item}>{allActorsFromDB[item]}</li>));

    let currentFilmsTable = (
    <div><h4>Films being shot today</h4><table>
        <tr>
            <td><ul id="film1"><li>{currentFilms[0]}</li></ul></td>
            <td><ul id="film2"><li>{currentFilms[1]}</li></ul></td>
            <td><ul id="film3"><li>{currentFilms[2]}</li></ul></td>
            <td><ul id="film4"><li>{currentFilms[3]}</li></ul></td>
            <td><ul id="film5"><li>{currentFilms[4]}</li></ul></td>
        </tr>
        <tr>
            <td><ul id="film6"><li>{currentFilms[5]}</li></ul></td>
            <td><ul id="film7"><li>{currentFilms[6]}</li></ul></td>
            <td><ul id="film8"><li>{currentFilms[7]}</li></ul></td>
            <td><ul id="film9"><li>{currentFilms[8]}</li></ul></td>
            <td><ul id="film10"><li>{currentFilms[9]}</li></ul></td>
        </tr>
    </table></div>);

    function GameInit(){
        let formEntry = document.getElementById("FilmIDEntry").value;
        if (!Number.isInteger(Number(formEntry))) return;
        if (formEntry <= 0 || formEntry > 200) return;
        allActors[formEntry] = 1;
        document.getElementById("ProgressButton").innerHTML = "Next Day";
        bGameStarted = true;
    }

    function incrementInfection(ActorIndex){
        if (allActors[ActorIndex] < 1){
            allActors[ActorIndex] -= Math.min(allActors[ActorIndex],0.05);
            return;
        }
        allActors[ActorIndex] += (Math.random()*0.5);
    }

    function UpdateZombieTables(){
        let Zombies=[];
        let Infected=[];
        let Healthy=[];
        let Dead=[];
        for (let i = 0; i < allActors.length; i++){
            incrementInfection(i);
            if (allActors[i] < 1){ //healthy
                Healthy.push(i);
            }
            else if (allActors[i] < 5){ //infected
                Infected.push(i);
            }
            else if (allActors[i] < 15){ //Zombie
                Zombies.push(i);
            }
            else{ //dead
                Dead.push(i);
            }
        }
        setHealthyActors(Healthy);
        setinfectedActors(Infected);
        setDeadActors(Dead);
        setZombieActors(Zombies);
        totalInfected = Infected.length + Zombies.length;
    }

    function OpenFilmsAndSpreadDisease(){
        currentFilms = new Array(10);
        for (let i = 0; i < 10; i++){
            let randomFilm = Math.round(Math.random()*allFilmsFromDB.length);
            if (randomFilm==0) randomFilm++;
            currentFilms[i] = allFilmsFromDB[randomFilm];
            // here, get actors assoc. with film and affect them.
            // Want to get: all affected actor ids and run func on them to affect them.
            let actorIdsToAffect = new Array();
            if (filmEdgeGraph[randomFilm-1] == undefined){
                fetch('../home/getActorsFromFilm/'+randomFilm)
                .then((response) => response.json())
                .then((json) => {
                    for (let i = 0; i < json.length; i++){
                        actorIdsToAffect.push(json[i].actorid-1);
                    }
                    SpreadDisease(actorIdsToAffect);
                    filmEdgeGraph[randomFilm-1] = actorIdsToAffect;
                });
                apiCalls++;
            }
            else{
                SpreadDisease(filmEdgeGraph[randomFilm-1]);
            }
        }
    }

    function SpreadDisease(actorArray){
        for (let infectorIndex = 0; infectorIndex < actorArray.length; infectorIndex++){
            let infector = allActors[actorArray[infectorIndex]];
            if (infector > 1 && infector < 15){
                let lower = 0;
                let upper = 2;
                if (infector < 2){
                    upper = 1.1;
                }
                else if (infector < 5){
                    upper = 1.5;
                }
                else {
                    lower = 0.5;
                    upper = 2;
                }
                for (let affectedIndex = 0; affectedIndex < actorArray.length; affectedIndex++){
                    if (allActors[actorArray[affectedIndex]] < 1){
                        if (Math.random() > 0.67){
                            allActors[actorArray[affectedIndex]] += (lower + Math.random()*(upper-lower));
                            // console.log("Disease spread to actor "+allActorsFromDB[actorArray[affectedIndex]]+
                            // ". This actor has a disease level of "+allActors[actorArray[affectedIndex]]);
                        }
                    }
                }
            }
        }
    }
    //This is what is happening at a high level.
    function ProgressGame(){
        if (!bGameStarted){
            GameInit();
            return;
        }
        UpdateZombieTables();
        OpenFilmsAndSpreadDisease();
        console.log("API Calls made: "+apiCalls);
    }
    return (
        <div>
            <h1 id="theheader">{totalInfected} Infected</h1>
            <h3 id="explainer1">Each day, 10 films are hosted and those actors go to work.</h3>
            <h3>The disease gradually becomes more infectious.</h3>
            <form className = "FilmForm"> 
                <h3>Who is patient zero?</h3>
                <input type="int" id = "FilmIDEntry" size="20"/>
            </form><br/>
            <div><button onClick={ProgressGame} id="ProgressButton">Start Game</button></div>
            <div>
                <ul>{responseList}</ul>
            </div>
            {currentFilmsTable}

            <div>
                <p id = "ListOfZombies">Zombies</p>
                <ul>{zombieList}</ul>
                <p id = "ListOfInfected">Infected</p>
                <ul>{infectedList}</ul>
                <p id = "ListOfHealthy">Healthy</p>
                <div><ul>{healthyList}</ul></div>
                <p id = "ListOfDead">Dead</p>
                <ul>{deadList}</ul>
            </div>
        </div>
    )
}

export default FetchAPI;