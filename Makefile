all:
	@echo "Happy birthday!"

run:
	node app.js

serve:
	@if [ -e .pidfile.pid ]; then		\
		kill `cat .pidfile.pid`;	\
		rm .pidfile.pid;		\
	fi

	@while [ 1 ]; do				\
		echo " [*] Running http server";	\
		make run &				\
		SRVPID=$$!;				\
		echo $$SRVPID > .pidfile.pid;		\
		echo " [*] Server pid: $$SRVPID";	\
		inotifywait -r -q -e modify .;		\
		kill `cat .pidfile.pid`;		\
		rm -f .pidfile.pid;			\
		sleep 0.1;				\
	done

