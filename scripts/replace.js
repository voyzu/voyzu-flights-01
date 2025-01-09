/* eslint sort-keys:"off" */

// Import required modules using ES6 syntax
import fs from 'node:fs';
import path from 'node:path'; // Useful for handling paths
import { sync as globSync } from 'glob';

const searchValues = [
    { search: 'flight', replace: 'movie' }, // Replace "movie" with your desired business object name (lower case)
    { search: 'Flight', replace: 'Movie' }   // Replace "Movie" with your desired business object name (capital first letter)
];

console.log(`Replacing ${searchValues[0].search} with ${searchValues[0].replace} in ${process.cwd()}`);

// Function to rename directories
function renameDirectories() {
    // Use globSync to find all directories, ignoring node_modules and scripts
    const directories = globSync('**/*', {
        ignore: ['node_modules/**', '**/node_modules/**', 'scripts/**'],
        nodir: false // Include directories
    });

    for (const dirPath of directories) {
        const dirName = path.basename(dirPath);
        let newDirName = dirName;

        // Apply all replacements for the directory name
        for (const { search, replace } of searchValues) {
            newDirName = newDirName.replaceAll(new RegExp(search, 'g'), replace);
        }

        // Rename the directory if its name has changed
        if (dirName !== newDirName) {
            const newDirPath = path.join(path.dirname(dirPath), newDirName);
            fs.renameSync(dirPath, newDirPath);
            console.log(`Renamed directory: ${dirPath} to ${newDirPath}`);
        }
    }
}

// Function to rename files and replace text in file contents
function renameFiles() {
    // Use globSync to find all files, ignoring node_modules and scripts
    const files = globSync('**/*', {
        ignore: ['node_modules/**', '**/node_modules/**', 'scripts/**'],
        nodir: true // Only include files
    });

    for (const filePath of files) {
        // Read the content of the file
        let content = fs.readFileSync(filePath, 'utf8');

        // Replace text in content while excluding "randFlightDetails"
        for (const { search, replace } of searchValues) {
            // Use a regex pattern to exclude "randFlightDetails"
            const regex = new RegExp(`(?<!rand)${search}`, 'g'); // Negative lookbehind
            content = content.replace(regex, replace);
        }

        // Write back content if it has changed
        if (content !== fs.readFileSync(filePath, 'utf8')) { // Compare to current content
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Updated file content: ${filePath}`);
        }
    }
}

// Process directory renaming first
renameDirectories();

// Then process file updating
renameFiles();