(function () {
    var math = window.math = angular.module("math", []);

    function nextNum (digits) {
        var result = 0;
        for (var i=0;i<digits;i++) {
            result = (result * 10) + Math.floor(Math.random() * 9 + 1);
        }
        return result;
    }

    function decimalPlaces (num) {
        var s = num.toString();
        var idx = s.indexOf(".");
        if (idx < 0) return 0
        else return s.length - 1 - idx;
    }

    var ops = {
        "+" : function (a, b) {return a + b;},
        "-" : function (a, b) {return a - b;},
        "×" : function (a, b) {return a * b;},
        "÷" : function (a, b) {return a / b;}
    };

    math.controller("AppCtrl", function ($scope, Backend) {
        var apply = function () { $scope.$$phase || $scope.$apply() };
        $scope.level = 2;
        $scope.time = 1;
        $scope.loading = true;
        $scope.playing = false;
        $scope.op = "+";

        Backend.recoverSession().then(
            function (user) {
                $scope.username = user.name;
                $scope.op = user.op || "+";
                $scope.level = user.level || 2;
                $scope.time = user.time || 1;
                $scope.loading = false;
            }
            ,
            function () {
                $scope.loading = false;
            }
        ).finally(apply);

        $scope.login = function () {
            $scope.loginError = null;
            Backend.login($scope.loginUsername, $scope.loginPassword).then(
                function (user) {
                    $scope.username = user.name;
                    $scope.op = user.op || "+";
                    $scope.level = user.level || 2;
                    $scope.time = user.time || 1;
                }
                ,
                function (error) {
                    $scope.loginError = error;
                }
            ).finally(apply);
        };

        ["op", "level", "time"].forEach(function (p) {
            $scope.$watch(p, function (v) {
                if (v) {
                    Backend.update(p, v);
                }
            });
        });

        $scope.logout = function () {
            Backend.logout();
            $scope.username = null;
            $scope.playing = false;
        };

        $scope.signup = function () {
            $scope.signupError = null;
            Backend.signup($scope.signupUsername, $scope.signupPassword).then(
                function (user) {
                    $scope.username = user.name;
                }
                ,
                function (error) {
                    $scope.signupError = error;
                }
            ).finally(apply);
        };

        var keydown = function (ev) {
            switch (ev.keyCode) {

                // subtract
                case 109:
                case 189:
                    $scope.num("-");
                    break;

                case 13: //enter
                case 32: //space
                    $scope.solution = "";
                    $scope.num("");
                    ev.preventDefault();
                    break;

                case 8: //backspace
                case 46: //delete
                    $scope.solution = $scope.solution.slice(0, $scope.solution.length - 1);
                    $scope.num("");
                    ev.preventDefault();
                    break;

                case 110: //dot
                case 190: //dot
                    $scope.num(".");
                    break;

                default:
                    if (ev.keyCode >= 96 && ev.keyCode <= 105) {
                        $scope.num(ev.keyCode-96);
                    } else if (ev.keyCode >= 48 && ev.keyCode <= 57 && !ev.shiftKey) {
                        $scope.num(ev.keyCode-48);
                    }

            }
        };

        $scope.go = function () {
            $scope.playing = true;
            var start = +new Date();
            var target = start + ($scope.time * 60 * 1000);
            window.addEventListener("keydown", keydown);
            $scope.score = 0;
            newProblem();
            var interval = setInterval(function () {
                if (+new Date() >= target) {
                    $scope.stats = true;
                    window.removeEventListener("keydown", keydown);
                    clearInterval(interval);
                    Backend.log($scope.op, $scope.level, $scope.time, $scope.score);
                    apply();
                    setTimeout(function () {
                        $scope.stats = false;
                        $scope.playing = false;
                        apply();
                    }, 5000);
                }
            }, 50);

        };

        $scope.success = function () {
            var attempt = parseFloat($scope.solution);
            if (attempt != null) {
                var solution = ops[$scope.op]($scope.left, $scope.right);
                if (decimalPlaces(solution) >= 5 && decimalPlaces(attempt) >= 5) {
                    return solution.toString().indexOf(attempt) === 0;
                }  else {
                    return solution == attempt;
                }
                return parseFloat($scope.solution) == ops[$scope.op]($scope.left, $scope.right);
            }
        };

        var newProblem = function () {
            $scope.solution = "";

            var leftDigits = Math.ceil($scope.level / 2);
            var rightDigits = Math.floor($scope.level / 2);

            $scope.left = nextNum(leftDigits);
            $scope.right = nextNum(rightDigits);

            $scope.$$phase || $scope.$apply();
        };

        $scope.num = function (num) {
            $scope.solution = $scope.solution + num.toString();
            if ($scope.success()) {
                $scope.score += Math.pow(10, $scope.level-2);
                setTimeout(newProblem, 500);
            }
            $scope.$$phase || $scope.$apply();
        };
    });

    math.directive('active', function () {
        return {
            scope: false,
            restrict: "A",
            link: function ($scope, $elem, $attrs) {
                $scope.$watch($attrs.active, function (val) {
                    if (val) {
                        $elem.addClass("active");
                    } else {
                        $elem.removeClass("active");
                    }
                });
            }
        };
    });

})();
