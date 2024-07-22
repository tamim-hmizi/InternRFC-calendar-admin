const dynamoDB = require ('./aws-config');

//Fonction d'ajout
const addItem = async (item) => {
    const params = {
        TableName: 'SessionTravail' ,
        item: item,
    };

    try {
        await dynamoDB.put(params).promise();
        console.log('Item added successfully');

    } catch (error) {
        console.error('Error adding item:', error);
    }
};

//Fonction de récupération
const getItem = async (key) => {
    const params = {
        TableName: 'SessionTravail' ,
        key: key,
    };
    try {
        const data = await dynameDB.get(params).promise();
        return data.Item;
    } catch (error) {
        console.error('Error getting item:' , error);
    }

};

module.exports = {addItem, getItem};