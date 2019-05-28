
for file in ../../experiments/results/benchmarks_results/*
do 
	echo 'Pushing '+$file
	npm run start $file abc.json

	curl --header "Content-Type: application/json" \
  		--request POST \
  		--data @abc.json \
  		http://localhost:9000/api/v1/experiment

  	rm -rf abs.json

done
