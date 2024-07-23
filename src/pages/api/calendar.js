import AWS from 'aws-sdk';

AWS.config.update({
    region: process.env.AWS_REGION || 'eu-central-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const dynamodb = new AWS.DynamoDB.DocumentClient();

export default async function handler(req, res) {
  if (req.method === 'POST') {
      try {
          const { personId, event } = req.body;

          console.log('Received request body:', { personId, event });

          if (!personId || !event) {
              console.log('Missing required fields');
              return res.status(400).json({ error: 'Missing required fields' });
          }

          const end = event.end !== undefined ? event.end : 'not specified';

          const params = {
              TableName: 'WorkSession',
              Key: { personId },
              UpdateExpression: 'SET events = list_append(if_not_exists(events, :empty_list), :event)',
              ExpressionAttributeValues: {
                  ':event': [event],
                  ':empty_list': []
              }
          };

          console.log('DynamoDB parameters:', params);

          await dynamodb.update(params).promise();

          res.status(200).json({ message: 'Event added successfully' });
      } catch (error) {
          console.error('Error adding event to DynamoDB:', error);
          res.status(500).json({ error: 'Error adding event', details: error.message });
      }
  } else if (req.method === 'GET') {
      try {
          const { personId } = req.query;
          if (!personId) {
              console.log('Missing personId');
              return res.status(400).json({ error: 'Missing personId' });
          }
          const params = {
              TableName: 'WorkSession',
              Key: { personId },
          };
          console.log('DynamoDB parameters for GET:', params);

          const data = await dynamodb.get(params).promise();
          res.status(200).json({ allEvents: data.Item ? data.Item.events : [] });
      } catch (error) {
          console.error('Error fetching events from DynamoDB:', error);
          res.status(500).json({ error: 'Error fetching events', details: error.message });
      }
  } else if (req.method === 'DELETE') {
    try {
      const {personId, event} = req.body;
      if (!personId || !event) {
        return res.status(400).json({error: 'Missing required fields'});
      }
      const params = {
        TableName:'WorkSession',
        Key: {personId},
        UpdateExpression: 'SET events = :events',
        ExpressionAttributeValues: {
          ':events': dynamodb.createSet(
            (await dynamodb.get({
              TableName: 'WorkSession',
              Key: {personId}
            }).promise()).Item.events.filter(e => !(e.title === event.title && e.start === event.start && e.end === event.end))
          )
        }
      };
      await dynamodb.update(params).promise();
      res.status(200).json({message: 'Event deleted successfully'});
    } catch (error) {
      res.status(500).json({error: 'Error deleting event', details: error.message});
    }
  }else {
      res.setHeader('Allow', ['POST', 'GET','DELETE']);
      res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
}
