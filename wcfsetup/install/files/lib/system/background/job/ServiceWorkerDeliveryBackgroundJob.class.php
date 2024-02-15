<?php

namespace wcf\system\background\job;

use Psr\Http\Client\ClientExceptionInterface;
use wcf\data\service\worker\ServiceWorker;
use wcf\data\service\worker\ServiceWorkerEditor;
use wcf\data\style\Style;
use wcf\data\user\notification\UserNotification;
use wcf\data\user\User;
use wcf\system\cache\runtime\UserProfileRuntimeCache;
use wcf\system\service\worker\ServiceWorkerHandler;
use wcf\system\session\SessionHandler;
use wcf\system\user\notification\UserNotificationHandler;
use wcf\system\WCF;
use wcf\util\JSON;
use wcf\util\StringUtil;

/**
 * @author      Olaf Braun
 * @copyright   2001-2024 WoltLab GmbH
 * @license     GNU Lesser General Public License <http://opensource.org/licenses/lgpl-license.php>
 * @since       6.1
 */
final class ServiceWorkerDeliveryBackgroundJob extends AbstractBackgroundJob
{
    /**
     * @param int $serviceWorkerID
     * @param int $notificationID
     */
    public function __construct(private readonly int $serviceWorkerID, private readonly int $notificationID)
    {
    }

    #[\Override]
    public function perform()
    {
        $serviceWorker = new ServiceWorker($this->serviceWorkerID);
        if (!$serviceWorker->workerID) {
            // Service worker no longer exists
            return;
        }
        $user = UserProfileRuntimeCache::getInstance()->getObject($serviceWorker->userID);
        //TODO use cache
        $style = new Style($user->styleID);
        /** @see NotificationEmailDeliveryBackgroundJob::perform() */
        $sql = "SELECT      notification.*, notification_event.eventID, object_type.objectType
                FROM        wcf1_user_notification notification
                LEFT JOIN   wcf1_user_notification_event notification_event
                ON          notification_event.eventID = notification.eventID
                LEFT JOIN   wcf1_object_type object_type
                ON          object_type.objectTypeID = notification_event.objectTypeID
                WHERE       notification.notificationID = ?
                ORDER BY    notification.time DESC";
        $statement = WCF::getDB()->prepare($sql, 1);
        $statement->execute([$this->notificationID]);

        /** @var UserNotification $notification */
        $notification = $statement->fetchObject(UserNotification::class);
        $statement->closeCursor();
        if (!$notification || !$notification->notificationID) {
            return;
        }
        $user = WCF::getUser();
        try {
            SessionHandler::getInstance()->changeUser(new User($notification->userID), true);
            $processedNotifications = UserNotificationHandler::getInstance()->processNotifications([$notification]);
            if ($processedNotifications['count'] == 0) {
                return;
            }
            \assert($processedNotifications['count'] === 1);
            $processedNotification = $processedNotifications['notifications'][0];
            \assert($processedNotification['notificationID'] === $notification->notificationID);
            $event = $processedNotification['event'];
            if ($event->isConfirmed()) {
                return;
            }

            $content = [
                "title" => $event->getTitle(),
                "message" => StringUtil::stripHTML($event->getMessage()),
                "url" => $event->getLink(),
                "notificationID" => $notification->notificationID,
                "time" => $notification->time,
                "icon" => $style->getFaviconAppleTouchIcon(),
            ];

            ServiceWorkerHandler::getInstance()->sendToServiceWorker($serviceWorker, JSON::encode($content));
        } catch (ClientExceptionInterface $e) {
            if ($e->getCode() === 413) {
                // Payload too large, we can't do anything here other than discard the message.
                \wcf\functions\exception\logThrowable($e);
            } elseif ($e->getCode() >= 400 && $e->getCode() <= 499) {
                // For all status codes 4xx, we should remove the service worker from the database.
                // The browser will register a new one.
                (new ServiceWorkerEditor($serviceWorker))->delete();
            } else {
                // For internal server errors(5xx), we will try again later
                throw $e;
            }
        } finally {
            SessionHandler::getInstance()->changeUser($user, true);
        }
    }
}
