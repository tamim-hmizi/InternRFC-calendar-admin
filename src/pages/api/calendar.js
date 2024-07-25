import AWS from 'aws-sdk';

AWS.config.update({
    region: process.env.AWS_REGION || 'eu-central-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const dynamodb = new AWS.DynamoDB.DocumentClient();

export default async function handler(req, res) {
    const { method } = req;

    if (method === 'POST') {
        try {
            const { personId, event } = req.body;

            if (!personId || !event) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            const params = {
                TableName: 'WorkSession',
                Key: { personId },
                UpdateExpression: 'SET events = list_append(if_not_exists(events, :empty_list), :event)',
                ExpressionAttributeValues: {
                    ':event': [event],
                    ':empty_list': []
                }
            };

            await dynamodb.update(params).promise();

            res.status(200).json({ message: 'Event added successfully' });
        } catch (error) {
            res.status(500).json({ error: 'Error adding event', details: error.message });
        }
    } else if (method === 'GET') {
        try {
            const { personId } = req.query;
            if (!personId) {
                return res.status(400).json({ error: 'Missing personId' });
            }
            const params = {
                TableName: 'WorkSession',
                Key: { personId },
            };

            const data = await dynamodb.get(params).promise();
            res.status(200).json({ allEvents: data.Item ? data.Item.events : [] });
        } catch (error) {
            res.status(500).json({ error: 'Error fetching events', details: error.message });
        }
    } else if (method === 'DELETE') {
        const { personId, title, start } = req.body;

        try {
            // Fetch the current item from DynamoDB
            const getItemParams = {
                TableName: 'WorkSession',
                Key: { personId }
            };

            console.log('Fetching item with params:', getItemParams);
            const data = await dynamodb.get(getItemParams).promise();
            console.log('Fetched data:', data);

            if (!data.Item) {
                return res.status(404).json({ error: 'Person not found' });
            }

            console.log('Original events:', data.Item.events);

            // Log details of the event to be deleted
            console.log('Event to be deleted - Title:', title, 'Start:', start);

            // Filter out the event to be deleted
            const updatedEvents = data.Item.events.filter(event => {
                const isMatch = event.title === title && event.start === start;
                if (isMatch) {
                    console.log('Matching event found and removed:', event);
                }
                return !isMatch;
            });

            console.log('Updated events:', updatedEvents);

            // Update the item in DynamoDB
            const updateItemParams = {
                TableName: 'WorkSession',
                Key: { personId },
                UpdateExpression: 'SET events = :events',
                ExpressionAttributeValues: {
                    ':events': updatedEvents
                }
            };

            console.log('Updating item with params:', updateItemParams);
            await dynamodb.update(updateItemParams).promise();
            console.log('Update successful');

            res.status(200).json({ message: 'Event deleted successfully' });
        } catch (error) {
            console.error('Error deleting event:', error);
            res.status(500).json({ error: 'Error deleting event', details: error.message });
        }
    } else {
        res.setHeader('Allow', ['POST', 'GET', 'DELETE']);
        res.status(405).json({ error: `Method ${method} not allowed` });
    }
}
