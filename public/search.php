<?php




    require(__DIR__ . "/../includes/config.php");
    
    
    
    // numerically indexed array of places
    $places = [];
    
    
    // TODO: search database for places matching $_GET["geo"]
    $geo = $_GET["geo"];
    
    
    /* str_replace is 1. search 2. replace 3. subject. It searches
    through the subject (geo) and replaces any instances of search
    with the second value.*/
    
    $geo = str_replace(",", " ", $geo);
    
    
    /* */
    $geo = trim($geo);
    
    
    /*This handy method takes a string and "explodes it out" in
     to an array. The array is configured by seperating the string
     with the first input into the function. */
    $geo = explode(" ", $geo);
    $count = count($geo);
    
    
    // error out if the user did not provide input
    if ($count < 1)
    {
    	print("Please enter a location.");
    }
    elseif ($count === 1)
    {
    	$geo = $geo[0];
    	//checking the length of geo to see if it is a standard US zip code length of 5.
    	if(strlen($geo) === 5)
    	{
    		$places = CS50::query("SELECT * FROM places WHERE postal_code = ?", $geo);	
    	}
    	//checking to see if geo is the length of a state abreviation  
    	elseif(strlen($geo) == 2)
    	{
    		$places = CS50::query("SELECT * FROM places WHERE admin_code1 = ?", strtoupper($geo));
    	}
    	//any fall through quiereies will be searched in places as a default. 
    	else
    	{
    		$places = CS50::query("SELECT * FROM places WHERE place_name LIKE ?", $geo);
    	}
    	
    }
    elseif($count > 1)
    {
    	// as you can imaginge, implode cacatinates an array to one string.
    	$geo = implode(" ", $geo);
    	// search through multiple fields within geo.
    	$places = CS50::query("SELECT * FROM places WHERE MATCH(postal_code, place_name, admin_name1, admin_code1) AGAINST (?)", $geo);
    }
  
  
    // output places as JSON (pretty-printed for debugging convenience)
    header("Content-type: application/json");
    print(json_encode($places, JSON_PRETTY_PRINT));
?>


