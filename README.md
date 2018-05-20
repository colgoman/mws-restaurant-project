# Mobile Web Specialist Certification Course
---
#### _Three Stage Course Material Project - Restaurant Reviews_

## Project Overview: Stage 2
The current stage of this project is stage 2.
### **Stage One**
A static design was taken which that lacked accessibility. This was converted to be responsive on different sized displays and accessible for screen reader use. Progressive web app features were also added for offline use.
### **Stage Two**
The responsive and accessible design from stage one was connected to an external server. Asynchronous Javascript was used to request JSON data from the server. Data received from the server was stored in an offline database using IndexedDB.
This app was optimised to meet the required performance benchmarks which was tested using Lighthouse.

Progressive Web App score should be at 90 or better.
Performance score should be at 70 or better.
Accessibility score should be at 90 or better.


### What do I do from here?

1. In this folder, start up a simple HTTP server to serve up the site files on your local computer. Python has some simple tools to do this, and you don't even need to know Python. For most people, it's already installed on your computer. 

In a terminal, check the version of Python you have: `python -V`. If you have Python 2.x, spin up the server with `python -m SimpleHTTPServer 8000` (or some other port, if port 8000 is already in use.) For Python 3.x, you can use `python3 -m http.server 8000`. If you don't have Python installed, navigate to Python's [website](https://www.python.org/) to download and install the software.

2. With your server running, visit the site: `http://localhost:8000`, and look around for a bit to see what the current experience looks like.

### Note about ES6

Most of the code in this project has been written to the ES6 JavaScript specification for compatibility with modern web browsers and future proofing JavaScript code. As much as possible, try to maintain use of ES6 in any additional JavaScript you write.



