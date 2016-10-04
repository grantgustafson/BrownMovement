This project has had its data redacted. The computational code remains but not the data dependencies.

Collaborators: Grant Gustafson, Wesley Herts, Colby Tresness, Cody Yu

This project took in as data csv files corresponding to access points with entries in the format:
Connect Time | Disconnect Time | Salted Mac Address

Note: Mac Address salting reset each day such that unique devices could not be connected between days.

Using Spark, this project ingested this input data to precompute count and flux data for any given day. 

This project is run by launching a Python SimpleHTTPServer in the root project directory which launches the web interface on localhost. A complex D3 visualization pulls from the precomputed data to animate movement across campus and provide an interactive view into movement patterns.