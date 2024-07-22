import AWS from 'aws-sdk';

const dynamodb = new AWS.DynamoDB.DocumentClient();

export default async function handler(req,res){
    if (req.method === 'GET'){
        try {
            const params ={
                TableName: 'Users',
                FilterExpression: '#role = :roleValue',
      ExpressionAttributeNames: {
        '#role': 'role'
      },
      ExpressionAttributeValues: {
        ':roleValue': 1
      }
            };

            const result = await dynamodb.scan(params).promise();

            res.status(200).json(result.Items);
        } catch (error) {
            console.error('Error fetching users from table:', error);
            res.status(500).json({ error: 'Error fetching users', details: error.message });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).json({error: 'Method ${req.method} not allowed'});
    }
}