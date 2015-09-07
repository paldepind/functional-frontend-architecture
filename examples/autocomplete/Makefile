SOURCE           = $(wildcard ./js/*.js)
BUILD            = js/main
TEST_SOURCE      = $(wildcard ./js/test*.js)
TEST_BUILD       = js/test
LIB_SOURCE       = $(wildcard ../../helpers/*.js)
BUILD_DIR        = ./js/build


build: jshint $(BUILD_DIR)/build.js

test-build: jshint $(BUILD_DIR)/test-build.js

$(BUILD_DIR)/build.js: $(BUILD_DIR) $(SOURCE) $(LIB_SOURCE)
	jspm bundle $(BUILD) $@

$(BUILD_DIR)/test-build.js: $(BUILD_DIR) $(SOURCE) $(LIB_SOURCE) $(TEST_SOURCE)
	jspm bundle-sfx $(TEST_BUILD) $@

$(BUILD_DIR):
	@mkdir -p $@

jshint:
	@jshint $(SOURCE) || true

clean:
	@rm -fr $(BUILD_DIR)

clean-deps:
	@rm -fr node_modules jspm_packages

init:
	@jspm init .

init-deps:
	@jspm install npm:ramda npm:ramda-fantasy npm:union-type npm:snabbdom npm:flyd npm:flyd-forwardto

.PHONY: init init-deps init-test-deps clean-deps clean jshint build test-build test-server
