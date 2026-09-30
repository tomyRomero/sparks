import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { v4 as uuidv4 } from 'uuid';
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isBase64Image(imageData: string) {
  const base64Regex = /^data:image\/(png|jpe?g|gif|webp|svg\+xml);base64,/;
  return base64Regex.test(imageData);
}

export function getDateTime() {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Months are zero-based
  const day = String(currentDate.getDate()).padStart(2, '0');
  let hours = currentDate.getHours();
  const minutes = String(currentDate.getMinutes()).padStart(2, '0');
  const period = hours >= 12 ? 'pm' : 'am';

  // Convert hours to 12-hour format
  hours = hours % 12 || 12;

  // Combine the date and time components into a string with the desired format (e.g., "MM-DD-YYYY h:mm am/pm")
  const formattedTimestamp = `${month}-${day}-${year} ${hours}:${minutes} ${period}`;

  return formattedTimestamp;
}

export const calculateTimeAgo = (currentDate: Date, eventTimestamp: string): string => {
  const eventDate = new Date(eventTimestamp.replace(/-/g, '/')); // Replace dashes with slashes for cross-browser compatibility
  const timeDifference = currentDate.getTime() - eventDate.getTime();
  const minutes = Math.floor(timeDifference / 60000); // 1 minute = 60,000 milliseconds
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) {
    return 'just now';
  } else if (minutes < 60) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (hours < 24) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
};

export function generateUniqueImageID() {
  return uuidv4();
}