
for file in emulated_data/*
do 
	echo 'Pushing '+$file

	curl --header "Content-Type: application/json" \
  		--request POST \
  		--data @$file \
  		http://localhost:9000/api/v1/experiment

done
