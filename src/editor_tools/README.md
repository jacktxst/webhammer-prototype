
# tools

tools, as opposed to things found in the action panel, are generally actions which have an interactive
way of use which may include tapping on objects, dragging things, etc.

tools are implemented as singleton objects

a tool can hold state about how it is being used, and part of its use may also include some memory.

to create a new tool, create a .js file here and define your tool.

then, in webhammer.js, the tool needs to be imported and added to the tools attribute of the core object.

# tool API

a tool object implements the following interface.