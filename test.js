var dataset = [
    [1,1,0],[0,1,1],[1,0,1],
    [10,10,12],[10,13,11],[13,13,54],
    [54,54,54],[55,55,56],[89,89,56],[57,55,56]
];
 
var clustering = require('density-clustering');
var dbscan = new clustering.DBSCAN();
// parameters: 5 - neighborhood radius, 2 - number of points in neighborhood to form a cluster
var clusters = dbscan.run(dataset, 5, 2);
var cont=0;
clusters.forEach(function(item, index){
    cont+=item.length;
})
console.log(cont);