import {Event} from '../../event';
import {Activity} from '../../../activities/activity';
import {Creator} from '../../../creators/creator';
import {Lap} from '../../../laps/lap';
import {Point} from '../../../points/point';
import {DataAltitude} from '../../../data/data.altitude';
import {DataCadence} from '../../../data/data.cadence';
import {DataHeartRate} from '../../../data/data.heart-rate';
import {DataSpeed} from '../../../data/data.speed';
import {EventInterface} from '../../event.interface';
import {DataLatitudeDegrees} from '../../../data/data.latitude-degrees';
import {DataLongitudeDegrees} from '../../../data/data.longitude-degrees';
import {DataPower} from '../../../data/data.power';
import {PointInterface} from '../../../points/point.interface';
import {CreatorInterface} from '../../../creators/creatorInterface';
import {Summary} from "../../../summary/summary";

export class EventImporterTCX {

  static getFromXML(xml: Document): EventInterface {

    const event = new Event();

    // Activities
    for (const activityElement of <any>xml.getElementsByTagName('TrainingCenterDatabase')[0].getElementsByTagName('Activity')) {
      const activity = new Activity();
      activity.type = activityElement.getAttribute('Sport');
      event.addActivity(activity);
      // First element must exist
      activity.startDate = new Date(activityElement.getElementsByTagName('Lap')[0].getAttribute('StartTime'));
      // Setup the creator
      activity.creator = this.getCreator(activityElement.getElementsByTagName('Creator')[0]);

      const activitySummary = new Summary();
      activity.summary = activitySummary;

      // Go over the laps and start filling up the summary and creating the points
      // @todo
      activitySummary.totalDurationInSeconds = 0;
      for (const lapElement of <any>activityElement.getElementsByTagName('Lap')) {
        // If the lap does not have any elapsed time or distance dont add it
        if (Math.round(Number(lapElement.getElementsByTagName('TotalTimeSeconds')[0].textContent)) === 0) {
          continue;
        }

        const lap = new Lap(
          new Date(lapElement.getAttribute('StartTime')),
          new Date(
            +(new Date(lapElement.getAttribute('StartTime'))) +
            1000 * Number(lapElement.getElementsByTagName('TotalTimeSeconds')[0].textContent)
          ));
        activity.addLap(lap);

        this.getPointsFromLapTrackPoints(lapElement.getElementsByTagName('Trackpoint')).map((point) => {
          activity.addPoint(point);
        });

        // if (lapElement.getElementsByTagName('Calories')[0]) {
        //   lap.setCalories(Number(lapElement.getElementsByTagName('Calories')[0].textContent));
        // }
        // if (lapElement.getElementsByTagName('Intensity')[0]) {
        //   lap.setIntensity(lapElement.getElementsByTagName('Intensity')[0].textContent);
        // }
        if (lapElement.getElementsByTagName('TriggerMethod')[0]) {
          lap.type = lapElement.getElementsByTagName('TriggerMethod')[0].textContent;
        }


      }
    }
    return event;
  }

  private static getPointsFromLapTrackPoints(trackPointsElements: HTMLElement[]): PointInterface[] {
    return Array.from(trackPointsElements).reduce((pointsArray: PointInterface[], trackPointElement) => {
      const point = new Point(new Date(trackPointElement.getElementsByTagName('Time')[0].textContent));
      pointsArray.push(point);
      for (const dataElement of <any>trackPointElement.children) {
        switch (dataElement.tagName) {
          case 'Position': {
            point.addData(new DataLatitudeDegrees(dataElement.getElementsByTagName('LatitudeDegrees')[0].textContent));
            point.addData(new DataLongitudeDegrees(dataElement.getElementsByTagName('LongitudeDegrees')[0].textContent));
            break;
          }
          case 'AltitudeMeters': {
            point.addData(new DataAltitude(dataElement.textContent));
            break;
          }
          case 'Cadence': {
            point.addData(new DataCadence(dataElement.textContent));
            break;
          }
          case 'HeartRateBpm': {
            point.addData(new DataHeartRate(dataElement.getElementsByTagName('Value')[0].textContent));
            break;
          }
          case 'Extensions': {
            for (const dataExtensionElement of <any>dataElement.getElementsByTagName('TPX')[0].children) {
              switch (dataExtensionElement.tagName) {
                case 'Speed': {
                  point.addData(new DataSpeed(dataExtensionElement.textContent));
                  break;
                }
                case 'RunCadence': {
                  point.addData(new DataCadence(dataExtensionElement.textContent));
                  break;
                }
                case 'Watts': {
                  point.addData(new DataPower(dataExtensionElement.textContent));
                  break;
                }
              }
            }
            break;
          }
        }
      }
      return pointsArray;
    }, []);
  }

  private static getCreator(creatorElement?: HTMLElement): CreatorInterface {
    const creator = new Creator();
    if (!creatorElement) {
      creator.name = 'Unknown device';
      return creator;
    }
    creator.name = creatorElement.getElementsByTagName('Name')[0].textContent;
    creator.setSerialNumber(creatorElement.getElementsByTagName('ProductID')[0].textContent);
    if (creatorElement.getElementsByTagName('Version')) {
      creator.setHWInfo(creatorElement.getElementsByTagName('Version')[0].textContent);
    }
    if (creatorElement.getElementsByTagName('Version')) {
      creator.setSWInfo(creatorElement.getElementsByTagName('Version')[0].textContent);
    }
    return creator;
  }
}
