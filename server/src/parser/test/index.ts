


let map: number[] = [];
for (let i = 0; i <= 100; i++) {
    map[i] = i * 2;
}

let search = ds.binarySearchLine(map, 200);
console.log(search);
