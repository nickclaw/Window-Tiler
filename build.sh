#backup old build
rm -rf ./~build
mv ./build ./~build

#create needed directories
mkdir -p -v ./build/{css,js}
cp -R ./src/image ./build/image

#copy some files
cp ./src/info.html ./src/popup.html ./src/manifest.json ./src/options.json ./build
cp ./src/js/background.js ./build/js/background.js

#compile and minimize javascript
in=./src/js/index.js
out=./build/js/index.js
curl -s \
	-d compilation_level=ADVANCED_OPTIMIZATIONS \
	-d output_format=text \
	-d externs_url="https://closure-compiler.googlecode.com/git/contrib/externs/chrome_extensions.js"\
	-d output_info=compiled_code \
	--data-urlencode "js_code@${in}" \
	http://closure-compiler.appspot.com/compile \
	> $out

#compile scss files
scss --style compressed ./src/css/style.scss ./build/css/style.css
scss --style compressed ./src/css/info.scss ./build/css/info.css

#optimize pngs
cd ./build/image
	for f in `find . -name "*.png"`
	do
	    convert $f -fuzz 10% -transparent none -strip $f
	done
cd ../..

zip -r window_tiler.zip ./build