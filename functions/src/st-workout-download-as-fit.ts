'use strict';

import * as functions from 'firebase-functions'
import * as cors from "cors";

const corsRequest = cors({origin: true});

const fetch = require('node-fetch');

export const stWorkoutDownloadAsFit = functions.region('europe-west2').https.onRequest((req, res) => {
  corsRequest(req, res, () => {
    console.log('Query:', req.query);
    console.log('Body:', req.body);

    let activityID = req.query.activityID;

    if (!activityID) {
      activityID = req.body.activityID;
    }

    if (!activityID) {
      res.status(403).send('No activity ID provided.');
    }

    const url = `https://www.sports-tracker.com/apiserver/v1/workout/exportFit/${activityID}?autogeneraterecords=true&generatefillerlaps=true&removesinglelocation=true`;
    const opts = {
      method: 'GET',
      headers: {
        'Content-Type': req.get('Content-Type'),
        'STTAuthorization': "f2mlnp8spic6d08ielfvc41ujq65bt8t",
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.131 Safari/537.36'
      },
    };
    console.log('Request:', url);
    console.log('opts:', opts);


    fetch(url, opts)
      .then((r:any) => {
        if (!r.ok) {
          res.status(500);
        }
        return r.buffer()
      })
      .then((body:any) => res.send(body))
  });
});
