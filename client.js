
let SavedM = localStorage.getItem("money");

let MoneyVar = SavedM ? SavedM : 100;
let MoneyLock = false;
let CardStartX = 0;
let CardStartY = 0;
let MaxDistance = 200;
let CardDragging = false;
let CardPercentageX = 0;
let CardPercentageY = 0;

const CardsPerPack = 60;

let Saved = localStorage.getItem("cards");
let userData = Saved ? JSON.parse(Saved) : { Data: [] };
console.log(getJsonSizeInKB(userData));

function getJsonSizeInKB(json) {
    const jsonString = JSON.stringify(json);
    const sizeInBytes = new TextEncoder().encode(jsonString).length;
    const sizeInKB = sizeInBytes / 1024;
    return `${sizeInKB.toFixed(2)} kb`;
}

function Money(x) {
    if (typeof x == "boolean") MoneyLock = x;
    if (MoneyLock) return;
    if (x > MoneyVar) return false;
    MoneyVar -= x;
    document.getElementById("money").innerText = `$${MoneyVar}`;
    localStorage.setItem('money',MoneyVar);
    return true;
}
Money(0);

function CheckChance(chance) {
    return Math.floor(Math.random() * chance) === 1;
}

function SwapPage(name) {
    let mult = 0;
    let found = false;
    Array.from(document.querySelector("nav div").children).forEach((button) => {
        button.className = "";
        if (button.innerText == name || found) {
            found = true;
            return;
        }
        mult++;
    });
    document.getElementById(`btn-${name}`).className = "active";
    document.getElementById("scroller").style.right = `${100 * mult}%`;
}

const cardTemplate = `
    <div class="card notshown">
        <div class="card-inner">
            <div class="card-front"><h3>PACK NAME</h3></div>
            <div class="card-back">
                <h4>PRE</h4>
                <h4>Card Name</h4>
                <h4></h4>
            </div>
        </div>
    </div>
`;

function cardDragX(e) {
    CardDragging = true;
    CardStartX = e.clientX;
}

function cardDragY(e) {
    CardDragging = true;
    CardStartY = e.clientY;
}

function formatDataString(str) {
    let updatedStr = str.replace(/<RANDOM:(\d+)-(\d+)>/g, (_, min, max) => {
        return Math.floor(Math.random() * (max - min + 1)) + Number(min);
    });
    return updatedStr;
}

function RollPack(PACK, Cards) {
    document.getElementById("opener").className = "active";
    let current = 1;
    function NextCard() {
        document.querySelector(
            "#opener section > h2"
        ).innerText = `${current}/${CardsPerPack}`;
        CardPercentageX = 0;
        CardPercentageY = 0;
        let weightedCards = Cards.map((name) => ({
            name,
            weight: (() => {
                const card = GameData.Cards.find((c) => c[0] == name);
                return card ? card[1] : 0;
            })(),
        }));
        let totalWeight = 0;
        for (let card of weightedCards) {
            if (!card) continue;
            totalWeight += 1 / card.weight;
        }
        const random = Math.random() * totalWeight;
        let addedWeight = 0;
        let picked;
        for (let card of weightedCards) {
            if (!card) continue;
            addedWeight += 1 / card.weight;
            if (random < addedWeight) {
                picked = card.name;
                break;
            }
        }
        picked = {
            Display: picked,
            AltDisplay: "",
            Pre: "",
            PreColor: "#ffffff",
            Changes: {},
        };

        let pickedNonShared = false;
        for (let chance of Object.values(GameData.Chances)) {
            if (!CheckChance(chance.Chance)) continue;
            if (chance.Shared == false && pickedNonShared == true) continue;
            if (chance.Shared == false) pickedNonShared = true;
            picked.Pre = chance.Display == "" ? picked.Pre : chance.Display;
            picked.PreColor =
                chance.Display == "" ? picked.PreColor : chance.BaseColor;
            picked.AltDisplay =
                chance.AltDisplay == "" ? picked.AltDisplay : chance.AltDisplay;
            let basecolor = formatDataString(chance.BaseColor);
            for (let [key, value] of Object.entries(chance.Changes)) {
                picked.Changes[key] = formatDataString(
                    value.replace(/<BASE>/g, basecolor)
                );
            }
        }

        userData.Data.push(picked);

        current++;
        CardPercentage = 0;
        document.querySelector("#opener section div").innerHTML = cardTemplate;
        let card = document.querySelector("#opener section div > div");
        let innercard = card.querySelector("div");
        for (let [key, value] of Object.entries(picked.Changes)) {
            card.querySelector("div > .card-back").style[key] = value;
        }
        card.querySelector("div > .card-front h3").innerText = PACK;
        card.querySelector("div > .card-back h4:first-child").innerText =
            picked.Pre;
        card.querySelector("div > .card-back h4:first-child").style.color =
            picked.PreColor;
        card.querySelector("div > .card-back h4:nth-child(2)").innerText =
            picked.Display;
        card.querySelector("div > .card-back h4:last-child").innerText =
            picked.AltDisplay;

        innercard.addEventListener("mousedown", cardDragX);
        let XDone = false;
        let checkerX = setInterval(() => {
            card.className = "card shown";
            innercard.style.transform = `rotateY(${
                (CardPercentageX / 100) * 180
            }deg)`;
            if (!CardDragging && CardPercentageX >= 75) {
                XDone = true;
                clearInterval(checkerX);
                CardPercentageY = 0;
                innercard.removeEventListener("mousedown", cardDragX);
                innercard.addEventListener("mousedown", cardDragY);
            }
        }, 10);
        let checkerY = setInterval(() => {
            if (!XDone) return;
            innercard.style.transform = `translateY(${
                (CardPercentageY / 100) * -100
            }px) rotateY(180deg)`;
            if (!CardDragging && CardPercentageY >= 75) {
                clearInterval(checkerY);
                innercard.removeEventListener("mousedown", cardDragY);
                setTimeout(() => {
                    card.className = "card notshown";
                }, 100);
                setTimeout(() => {
                    if (current > CardsPerPack) {
                        localStorage.setItem("cards", JSON.stringify(userData));
                        console.log(getJsonSizeInKB(userData));
                        return;
                    } else {
                        NextCard();
                    }
                }, 400);
            }
        }, 10);
    }
    NextCard();
}

Array.from(document.querySelector("nav div").children).forEach((button) => {
    button.addEventListener("click", () => {
        SwapPage(button.innerText);
    });
});

Object.values(GameData.Packs).forEach((pack) => {
    let newStoreItem = document.querySelector("#Store .preset").cloneNode(true);
    newStoreItem.className = "";
    newStoreItem.querySelector("h3:first-child").innerText = pack.Display;
    newStoreItem.querySelector("h3:last-child").innerText = `$${pack.Price}`;
    document.querySelector("#Store div").appendChild(newStoreItem);
    newStoreItem.addEventListener("click", () => {
        Money(pack.Price);
        Money(true);
        RollPack(pack.Display, pack.Cards);
    });
});

document.addEventListener("mousemove", (e) => {
    if (CardDragging) {
        let distanceMovedX = e.clientX - CardStartX;
        let distanceMovedY = CardStartY - e.clientY;

        if (distanceMovedX > MaxDistance) {
            distanceMovedX = MaxDistance;
        } else if (distanceMovedX < 0) {
            distanceMovedX = 0;
        }

        if (distanceMovedY > MaxDistance) {
            distanceMovedY = MaxDistance;
        } else if (distanceMovedY < 0) {
            distanceMovedY = 0;
        }

        CardPercentageX = (distanceMovedX / MaxDistance) * 100;
        CardPercentageY = (distanceMovedY / MaxDistance) * 100;
    }
});

document.addEventListener("mouseup", () => {
    CardDragging = false;
    CardPercentageX = CardPercentageX >= 75 ? 100 : 0;
    CardPercentageY = CardPercentageY >= 75 ? 100 : 0;
});

document.addEventListener("keydown", function (event) {
    if (event.key === " " || event.key === "Spacebar") {
        CardPercentageX = 100;
        CardPercentageY = 100;
    }
});
