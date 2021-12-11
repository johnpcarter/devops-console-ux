#!/bin/sh

if [ "$1x" == "debugx" ]
then
	ng build --base-href /JcDevopsConsole/
else
	ng build  --prod --base-href /JcDevopsConsole/
fi

# remove old version from package

TGT_PATH=/Applications/SoftwareAG/10.11/IntegrationServer/instances/default/packages/JcDevopsConsole/pub
rm -Rf ${TGT_PATH}/*.*.js
rm -Rf ${TGT_PATH}/*.*.css
rm -Rf ${TGT_PATH}/font-*

# copy new build to package

cp -R dist/wm-devops-console/* ${TGT_PATH}

# changes paths to include package name-space

if [ -r ${TGT_PATH}/main.js ]
then
	main="${TGT_PATH}/main.js"
else
	main=`ls ${TGT_PATH}/main.*.js`
fi

#sed "s/favicon/\/JcDevopsConsole\/favicon/g" ${TGT_PATH}/index.html > ${TGT_PATH}/index.html.copy
#mv ${TGT_PATH}/index.html.copy ${TGT_PATH}/index.html

#sed "s/src\=\"/src\=\"\/JcDevopsConsole\//g" ${TGT_PATH}/index.html > ${TGT_PATH}/index.html.copy
#mv ${TGT_PATH}/index.html.copy ${TGT_PATH}/index.html

#sed "s/styles\./\/JcDevopsConsole\/styles\./g" ${TGT_PATH}/index.html > ${TGT_PATH}/index.html.copy
#mv ${TGT_PATH}/index.html.copy ${TGT_PATH}/index.html

#sed "s/\assets/\/JcDevopsConsole\/assets/g" ${main} > ${main}.copy
#cp ${main}.copy ${main}

#sed "s/\.\/images/\/JcDevopsConsole\/images/g" ${main} > ${main}.copy
#mv ${main}.copy ${main}

cd ${TGT_PATH}
/Users/jcart/Scripts/shell/cpFileToDirs.sh .access

echo "-------> built ${BLD_NEW}"
