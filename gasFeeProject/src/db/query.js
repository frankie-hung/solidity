// query to get totalGas and blocks group by date
db.getCollection('blocks').aggregate([
    {
      $group: {
        _id: {
          $add: [
           { $dayOfYear: "$timestamp"}, 
           { $multiply: 
             [400, {$year: "$timestamp"}]
           }
        ]
        },
        totalGasUsed: { $sum: "$gasUsed" },
        count: { $sum: 1 },
        first: { $min: "$timestamp"}
      }
    }, { $sort: { _id: 1 }},
    { $project: { date: "$first", totalGasUsed: 1, count: 1, _id: 0} }
  ]);
