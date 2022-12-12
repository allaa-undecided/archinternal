Allaa Elkhouly 900201771
Salma Ahmed Aly 900203182
Yehia Elkasas 900202395

1. Issues faced:
When we were discussing how to approach the project in order to set a plan and divide the work, we were torn between working in c++ or javascript. The main point of confusion is that we didn't know exactly how we wanted to execute the algorithm and which bonuses would be best to complete given the time constraints. We were debating on whether or not to implement the GUI because it will then make it hard to use C++ since SFML and imgui's learning curves aren't the best. However, the logic would be easier to implement on C++ using classes and structs. We continued brainstorming and trying out different approaches until we decided to use javascript because we really wanted to do the GUI and be able to visualize everything. In addition, javascript isn't very hard to work around and understand. 

We faced several recurring issues related to the communication of the files and being able to integrate and utilize functions and variables from one object file to another. That's because we weren't very familiar with inheritance and polymorphism in javascript and html and how we can use it to our advantage in an interlinkable manner. We wanted changes to reflect in multiple files at once and ensure that the files talk to one another concurrently. 

Furthermore, there were some inconsistencies with the file naming because we were working in parallel and working together to solve issues and errors that arose and so we got confused. Our logic is spread across multiple files and different functions and classes, sometimes we referenced the wrong object or function which led to errors that took some time to find. 

It was hard keeping track of the number of cycles of each instruction, when they finished issuing, executing, and writing back. We sometimes confused the clock cycles of the instructions with one another. 

2. Assumptions:
No assumptions other than those present in the project file were made. 

3. What works:
All operations listed in the project file are supported: the LOAD, STORE, MUL, ADD, ADDI, BEQ, JAL, RET, NEG, and NOR. The user inputs the program when greeted with the home page of the simulation and then they will be able to see the algorithm in action and the output required in the project description. 

4. What does not work/incomplete:
Everything works as expected

5. Test Cases
We created three different programs to test all instructions using the simulator. The first one didn't really have an objective behind it, it's only purpose is to utilize all 8 registers and test out most of the instructions. Most of the instructions were useless and some were used to test functionalities like the JAL to skip an instruction and the NOR to see if it does it correctly. 
The second program was done to meet the loop requirement. We also added some unnecessary instructions like loading x1 and x2 in order to test the multiplication. The purpose of the program was to loop 6 times using a counter that we decremented in every iteration. However, it didn't provide us with an output. 
The third program was the most meaningful where it implemented a divider using a loop. We would load immediate the dividend and then used the NEG instruction to get the divisor. We looped over the branching condition of the dividend equal to zero and subtracted the dividend by the divisor in every loop iteration. I had a counter incrementing by 1 in every iteration to keep track of the quotient which is then stored back in x1. 